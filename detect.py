######## Webcam Object Detection Using Tensorflow-trained Classifier #########
#
# Author: Evan Juras
# Date: 11/11/22
# Description: 
# This program uses a TensorFlow Lite object detection model to perform object 
# detection on an image or a folder full of images. It draws boxes and scores 
# around the objects of interest in each image.
#
# This code is based off the TensorFlow Lite image classification example at:
# https://github.com/tensorflow/tensorflow/blob/master/tensorflow/lite/examples/python/label_image.py
#
# I added my own method of drawing boxes and labels using OpenCV.

# Import packages
import cv2
import numpy as np
import time

from tensorflow.lite.python.interpreter import Interpreter

def get_detections(imagename, model_path):
	min_conf_threshold = 0.45

	interpreter = Interpreter(model_path=model_path)
	interpreter.allocate_tensors()

	# Get model details
	input_details = interpreter.get_input_details()
	output_details = interpreter.get_output_details()
	height = input_details[0]['shape'][1]
	width = input_details[0]['shape'][2]

	floating_model = (input_details[0]['dtype'] == np.float32)
	integer_model = (input_details[0]['dtype'] == np.uint8)

	input_mean = 127.5
	input_std = 127.5

	# Check output layer name to determine if this model was created with TF2 or TF1,
	# because outputs are ordered differently for TF2 and TF1 models
	outname = output_details[0]['name']

	if ('StatefulPartitionedCall' in outname): # This is a TF2 model
		boxes_idx, classes_idx, scores_idx = 1, 3, 0
	else:
		boxes_idx, classes_idx, scores_idx = 0, 1, 2
		
	image = cv2.imread(imagename)
	image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
	imH, imW, _ = image.shape 
	image_resized = cv2.resize(image_rgb, (width, height))
	input_data = np.expand_dims(image_resized, axis=0)

	# Normalize pixel values if using a floating model (i.e. if model is non-quantized)
	if floating_model:
		input_data = (np.float32(input_data) - input_mean) / input_std
	# if integer_model:
	# 	input_data = (np.float32(input_data) - input_mean) / input_std

	# Perform the actual detection by running the model with the image as input

	interpreter.set_tensor(input_details[0]['index'],input_data)

	interpreter.invoke()

	boxes = interpreter.get_tensor(output_details[boxes_idx]['index'])[0] # Bounding box coordinates of detected objects
	classes = interpreter.get_tensor(output_details[classes_idx]['index'])[0] # Class index of detected objects
	scores = interpreter.get_tensor(output_details[scores_idx]['index'])[0] # Confidence of detected objects

	detections = []
	for i in range(len(scores)):
		if ((scores[i] > min_conf_threshold) and (scores[i] <= 1.0)):
			ymin = int(max(1,(boxes[i][0] * imH)))
			xmin = int(max(1,(boxes[i][1] * imW)))
			ymax = int(min(imH,(boxes[i][2] * imH)))
			xmax = int(min(imW,(boxes[i][3] * imW)))
			object_name = int(classes[i]) # Look up object name from "labels" array using class index
			detections.append([object_name, scores[i], xmin, ymin, xmax, ymax])

	return detections

if __name__ == "__main__":
	start = round(time.time() * 1000)
	detections = get_detections("note1.jpg", "model.tflite")
	end = round(time.time() * 1000)

	image = cv2.imread("note1.jpg")

	for detection in detections:
		xmin = detection[2]
		ymin = detection[3]
		xmax = detection[4]
		ymax = detection[5]
		cv2.rectangle(image, (xmin, ymin), (xmax, ymax), (10, 255, 0), 2)
		label = '%s: %d%%' % (detection[0], int(detection[1] * 100)) # Example: 'person: 72%'
		labelSize, baseLine = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.7, 2) # Get font size
		label_ymin = max(ymin, labelSize[1] + 10) # Make sure not to draw label too close to top of window
		cv2.rectangle(image, (xmin, label_ymin-labelSize[1]-10), (xmin+labelSize[0], label_ymin+baseLine-10), (255, 255, 255), cv2.FILLED) # Draw white box to put label text in
		cv2.putText(image, label, (xmin, label_ymin-7), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 0), 2) # Draw label text

	cv2.imshow('Object detector', image)

	print(f"time: {end - start}ms")

	# Clean up
	cv2.waitKey()
	cv2.destroyAllWindows()