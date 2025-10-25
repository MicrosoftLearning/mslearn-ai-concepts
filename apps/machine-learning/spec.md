This is a specification for a web app named "ML Lite" that can be used to train simple machine learning models. The app should be a HTML 5 web site with a single HTML file supported by a single JavaScript file for code and a single CSS file for visual themes.

# Visual Style

The apps should use a minimalist style with a grey background, and a white area in the middle for the main content.

Buttons and other interface highlight elements (such as lines under selected tabs or other minor highlights) should be "Microsoft blue"

## Functionality

The app will enable users to train one of three types of machine learning model based on a .csv file they upload:

- Regression (using a linear regression algorithm)
- Classification (binary or multiclass, using a Logistic regression algorithm)
- Clustering (using a K-Means algorithm)

The app will provide interface elements to allow users to:
- Choose the label column that regression or classification models will predict
- Choose the feature columns to be included in the model
- Choose the proportions of data to be used for training and validation

# Technology

The app should use JavaScript, HTML, and CSS to render the user interface and interactivity. It should use PyScript with numpy, pandas, and scikit-learn libraries to perform machine learning model training and inferencing. hen training models, use the scikit-learn pipeline approach so that featurization and other data preparation tasks are incorporated into the trained model.

## Layout

The app should function as a tabbed wizard, with the following tabs arranged vertically and Next/Previous buttons to navigate. The Next button should be disabled until the user has provided the necessary inputs and all required tasks have been performed to proceed to the next step:

- "Model type and Data": On this tab, the user can select the type of model they want to train and upload the data file. When the file is uploaded, the first 20 rows should be shown and the user can specify whether or not the first row contains the column headers. If it does not, the app should enable them to enter column headers in text boxes above the columns of data.
- "Training settings": On this page, for classification and regression models, the user can choose the target label column, the feature columns to be included, and the proportion of training vs validation data (with a default of 70% training vs 30% validation). For clustering models, the user can select the features to be used and the number of clusters to create (i.e. the value for K) - with a default option for the app to figure out the optimal number of clusters based on the data.
- "Training process": On this page, the user can review settings and start the training process. The UI should show the progress of the training job, including featurization, training and validation phases. In the featurization phase, the app should encode categorical features, impute any missing values, and normalize numeric columns. When training a clustering model, if the user has chosen to let the application find the optimal number of clusters, it should start with 2 and try up to 6, evaluating the Silhouette score for each to identify the best results. It should then finish by creating a model with the optimal number of clusters based on the Silhouette scores.
- "Training results": On this page, the user should see confirmation that the model was trained along with the key metrics and visualizations:
    - For regression models, report MAE, MSE, RMSE, and R2, and display a scatter plot of predicted vs actual labels with a line for ideal predictions.
    - For classification models, report accuracy, precision, recall, and F1 scores, and display a confusion matrix with shaded cells from white (low) to "Microsoft Blue" (high) to reflect the values.
    - For clustering models, report the number of clusters, the silhouette score, the mean distance between cluster centers and their points, and the mean distance between cluster centers. Display a color-coded scatter plot showing the cluster points "flattened" to 2 dimensions.
- "Test": On this tab, the user can test the model by entering feature values and generating a prediction. The interface should provide appropriate input elements for the features pre-populated with suitable values based on the original training data.

