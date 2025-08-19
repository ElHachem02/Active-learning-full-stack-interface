from dummy_server.constants import MODEL_PATH
import torch
import torch.nn as nn
import timm

NUM_CLASSES = 398


class Model(nn.Module):
    def __init__(self, num_classes=NUM_CLASSES):
        super(Model, self).__init__()

        self.num_classes = num_classes

        # TODO: Load pre-trained full model here (efficientnet + fc layer trained on the training data)
        self._model = timm.create_model("efficientnet_b0", pretrained=True)

        # Freeze the base model (optional) - we only train the last MLP layers for new samples
        for param in self._model.parameters():
            param.requires_grad = False

        # Replace the final classifier layer with one for multi-label classification
        # NOTE: These params are not frozen
        self._model.classifier = nn.Sequential(
            nn.Linear(
                in_features=self._model.classifier.in_features, out_features=1024
            ),  # First hidden layer
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(1024, 512),  # Second hidden layer
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(512, self.num_classes),  # Output layer (387 classes)
        )

    def forward(self, x):
        return self._model(x)

    def get_uncertainty(self, probs):
        # Approach 1: BALD
        probs_mean = probs.mean(dim=0)  # [batch_size, num_classes]
        predictive_entropy = -torch.sum(
            probs_mean * torch.log(probs_mean + 1e-8), dim=-1
        )  # [batch_size]

        entropy_per_sample = -torch.sum(
            probs * torch.log(probs + 1e-8), dim=-1
        )  # [N, batch_size]
        model_entropy = entropy_per_sample.mean(dim=0)  # [batch_size]

        mutual_information = predictive_entropy - model_entropy

        # TODO (?): Other approaches (e.g. first min over the num_preds, then total entropy), total_entropy with just 1 pred
        return mutual_information, predictive_entropy

    def inference(self, x, num_preds=10):
        """Inference function that returns probabilities and uncertainty."""
        # Assumes x has shape (batch_size, channels, height, width) (even for batch size 1)

        # Set to train so droupout still works (so we get random outputs)
        self.train()

        # Pass the input through the EfficientNet feature extractor once (for efficiency), not the classification head
        features = self._model.forward_features(x)
        pooled = self._model.global_pool(features)  # (batch_size, classifier_in)

        # Run through classifier head N times
        pooled_repeated = pooled.unsqueeze(0).repeat(
            num_preds, 1, 1
        )  # (num_samples, batch_size, classifier_in)
        pooled_repeated = pooled_repeated.view(
            -1, *pooled.size()[1:]
        )  # Flatten to (num_samples * batch_size, ...)
        logits = self._model.classifier(pooled_repeated)
        probs = torch.sigmoid(logits)
        probs = probs.view(
            num_preds, -1, self.num_classes
        )  # Reshape back to (num_samples, batch_size, num_classes)

        assert probs.shape[0] == num_preds
        assert probs.shape[1] == x.shape[0]  # batch_size
        assert probs.shape[2] == self.num_classes

        # For final prediction, take min/mean across all dimensions (min to reduce uncertainty) - but maybe don't even need this
        # TODO (possibly): already introduce thresholding here for outputting just bird class labels
        return (
            probs.mean(dim=0),
            self.get_uncertainty(probs)[0],
            self.get_uncertainty(probs)[1],
        )

    def save(self, path=MODEL_PATH):
        print("Saved model to ", path)
        torch.save(self.state_dict(), path)
