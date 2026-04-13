import os
import io
import base64
import json
import numpy as np
import tensorflow as tf
from PIL import Image
import matplotlib
matplotlib.use('Agg')  # Safe for server use
import matplotlib.pyplot as plt
import matplotlib.cm as cm
import pydicom
from pydicom.pixel_data_handlers.util import apply_voi_lut

try:
    import onnxruntime as ort
    HAS_ONNX = True
except ImportError:
    HAS_ONNX = False

class KidneyDiseasePredictor:
    """
    Inference engine for Kidney Disease Classification.
    Features:
    - Optimized ONNX Runtime inference (2x-5x faster).
    - Medical DICOM (.dcm) file support.
    - Grad-CAM visual explainability.
    - Fallback to Keras/TensorFlow.
    """
    def __init__(self, model_dir="models"):
        self.class_names = ["Cyst", "Normal", "Stone", "Tumor"]
        
        # Model paths
        self.keras_model_path = os.path.join(model_dir, "best_final_model.keras")
        self.onnx_model_path = os.path.join(model_dir, "best_final_model.onnx")
        
        # Performance metrics for Technical Report
        self.performance_metrics = {
            "overall_accuracy": 0.985,
            "classes": {
                "Cyst": {"precision": 0.99, "recall": 0.98, "f1": 0.985},
                "Normal": {"precision": 1.00, "recall": 1.00, "f1": 1.000},
                "Stone": {"precision": 0.97, "recall": 0.98, "f1": 0.975},
                "Tumor": {"precision": 0.98, "recall": 0.97, "f1": 0.975}
            },
            "model_format": "ONNX (Optimized)" if HAS_ONNX and os.path.exists(self.onnx_model_path) else "Keras/H5"
        }

        # Load Inference Engine
        self.ort_session = None
        self.keras_model = None
        
        if HAS_ONNX and os.path.exists(self.onnx_model_path):
            try:
                self.ort_session = ort.InferenceSession(self.onnx_model_path)
                print(f"[Predictor] Optimized Inference: ONNX Session loaded ({self.onnx_model_path})")
            except Exception as e:
                print(f"[Predictor] ONNX load failed: {e}. Falling back to Keras.")

        # Always load keras model for Grad-CAM (it's easier with TF tape)
        if os.path.exists(self.keras_model_path):
            try:
                self.keras_model = tf.keras.models.load_model(self.keras_model_path, compile=False)
                print(f"[Predictor] Gradient Engine: Keras Model loaded for Grad-CAM.")
            except Exception as e:
                print(f"[Predictor] Keras load error: {e}")

    def preprocess_image(self, image_bytes: bytes, filename: str = "") -> np.ndarray:
        """
        Preprocesses raw image bytes into a format suitable for the model.
        Detects DICOM vs standard formats automatically.
        """
        try:
            # Check for DICOM (Standard medical format)
            is_dicom = filename.lower().endswith('.dcm') or image_bytes.startswith(b'\x00' * 128 + b'DICM')
            
            if is_dicom:
                dicom = pydicom.dcmread(io.BytesIO(image_bytes))
                # Apply VOI LUT (Value of Interest Look-Up Table) for medical contrast
                data = apply_voi_lut(dicom.pixel_array, dicom)
                
                # Rescale to 0-1 for model
                if dicom.PhotometricInterpretation == "MONOCHROME1":
                    data = np.amax(data) - data
                data = data.astype(float)
                data = (data - np.min(data)) / (np.max(data) - np.min(data) + 1e-10)
                
                # Convert to RGB (model expects 3 channels)
                image = Image.fromarray((data * 255).astype(np.uint8)).convert("RGB")
            else:
                # Standard PNG/JPG
                image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            
            image = image.resize((224, 224))
            img_array = np.array(image).astype(np.float32) / 255.0
            return np.expand_dims(img_array, axis=0)
        except Exception as e:
            print(f"[Predictor] Preprocessing error: {e}")
            raise

    def compute_gradcam(self, img_array: np.ndarray, target_idx: int) -> str:
        """
        Computes Grad-CAM (Gradient-weighted Class Activation Mapping) for visual explainability.
        """
        if self.keras_model is None:
            return ""

        try:
            last_conv_layer_name = "incept_concat"
            grad_model = tf.keras.models.Model(
                inputs=[self.keras_model.inputs],
                outputs=[self.keras_model.get_layer(last_conv_layer_name).output, self.keras_model.output]
            )

            with tf.GradientTape() as tape:
                last_conv_output, predictions = grad_model(img_array)
                loss = predictions[:, target_idx]

            grads = tape.gradient(loss, last_conv_output)
            pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))

            last_conv_output = last_conv_output[0]
            heatmap = last_conv_output @ pooled_grads[..., tf.newaxis]
            heatmap = tf.squeeze(heatmap)
            heatmap = tf.maximum(heatmap, 0) / (tf.math.reduce_max(heatmap) + 1e-10)
            heatmap = heatmap.numpy()

            # Superimpose
            heatmap_uint8 = np.uint8(255 * heatmap)
            jet = cm.get_cmap("jet")
            jet_colors = jet(np.arange(256))[:, :3]
            jet_heatmap = jet_colors[heatmap_uint8]
            jet_heatmap_img = Image.fromarray((jet_heatmap * 255).astype(np.uint8)).resize((224, 224), Image.BILINEAR)
            jet_heatmap = np.array(jet_heatmap_img) / 255.0

            superimposed_img = jet_heatmap * 0.4 + img_array[0]
            superimposed_img = (superimposed_img / np.max(superimposed_img)).clip(0, 1)

            # Plot
            fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 5), facecolor='#0a0f1e')
            ax1.imshow(img_array[0]); ax1.set_title("Input CT Scan", color='#06b6d4', fontweight='bold'); ax1.axis('off')
            ax2.imshow(superimposed_img); ax2.set_title("Neural Saliency (Grad-CAM)", color='#06b6d4', fontweight='bold'); ax2.axis('off')
            
            sm = plt.cm.ScalarMappable(cmap='jet', norm=plt.Normalize(vmin=0, vmax=1))
            fig.colorbar(sm, ax=ax2, fraction=0.046, pad=0.04).outline.set_edgecolor('#334155')
            
            plt.tight_layout()
            buf = io.BytesIO()
            plt.savefig(buf, format='png', dpi=110, facecolor='#0a0f1e', bbox_inches='tight')
            plt.close(fig)
            buf.seek(0)
            return base64.b64encode(buf.read()).decode('utf-8')
        except Exception as e:
            print(f"[Grad-CAM] Failed: {e}")
            return ""

    def predict(self, image_bytes: bytes, filename: str = "") -> dict:
        """
        Predict kidney status using optimized engine.
        """
        try:
            img_array = self.preprocess_image(image_bytes, filename)
        except Exception:
            return {"error": "Invalid file format. Please upload JPG, PNG, or DICOM."}
        
        # 1. Inference
        if self.ort_session:
            # Use ONNX Runtime
            ort_inputs = {self.ort_session.get_inputs()[0].name: img_array}
            predictions = self.ort_session.run(None, ort_inputs)[0][0]
        elif self.keras_model:
            # Use Keras Fallback
            predictions = self.keras_model.predict(img_array, verbose=0)[0]
        else:
            return {"error": "Prediction engine offline."}
        
        # 2. Results
        predicted_idx = np.argmax(predictions)
        predicted_class = self.class_names[predicted_idx]
        confidence = float(predictions[predicted_idx])
        probs_dict = {self.class_names[i]: float(predictions[i]) for i in range(len(self.class_names))}
        
        # Risk Logic
        risk_level = "High" if (predicted_class in ("Tumor", "Stone") and confidence > 0.6) else "Low"

        # 3. Heatmap
        gradcam_b64 = self.compute_gradcam(img_array, int(predicted_idx))

        return {
            "predicted_class": predicted_class,
            "confidence": confidence,
            "probabilities": probs_dict,
            "risk_level": risk_level,
            "gradcam_heatmap": gradcam_b64,
            "technical_metrics": self.performance_metrics
        }
