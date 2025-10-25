This is a specification for an Information Extractor app that reads receipts and uses a Large Language Model to identify specific field values. The app should be a HTML 5 web site with a single HTML file supported by a single JavaScript file for code and a single CSS file for visual themes.

The app should use Tesseract.js to extract text from uploaded images, and then use WebLLM with a Microsoft Phi 3 Mini 4K model to extract the field information.

Users can upload up to 5 images. Uploaded images should be listed as thumbnails vertically on the left side, and the selected image should be shown in full in the center area. When the user analyzes the image, the app should use Tesseract to perform OCR and extract the text, then submit the following prompt to the Web LLM model:

```
The following text was extracted from a scanned receipt:
---
{the extracted text from the image}
---
Please identify the most likely values for these fields:
- Vendor
- Vendor-Address
- Vendor-Phone
- Receipt-Date
- Receipt-Time
- Total-spent

Date fields should be formatted as mm/dd/yyyy

Respond as a list of fields with their values.
```

When analysis is complete:
- The resulting list of fields should be shown in the "Fields" tabe in the pane on the right.
- The full extracted OCR JSOn from tesseract should be in the "Result" tab, in the same pane as the "Fields" tab.
- The full image should be replaced with a canvas showing the bounding boxes for the individual words extracted by Tesseract should be overlaid on the original image.