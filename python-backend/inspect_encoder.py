import joblib

# Load the label encoder to see what classes it expects
le_persona = joblib.load('label_encoder_v2.joblib')

print("Available persona classes in the label encoder:")
print(le_persona.classes_)
print(f"\nNumber of classes: {len(le_persona.classes_)}")

# Also check the training columns
training_columns = joblib.load('training_columns_v2.joblib')
print(f"\nTraining columns:")
for i, col in enumerate(training_columns):
    print(f"{i+1}. {col}")
