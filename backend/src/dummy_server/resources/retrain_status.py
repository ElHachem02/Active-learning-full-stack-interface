from flask_restful import Resource
from dummy_server.model.retrain import status
from flask_cors import cross_origin
from dummy_server.db.sqlite import Uncertainty


class RetrainStatusResource(Resource):
    @cross_origin()
    def get(self):
        return {
            "status": "retraining" if status["retraining"] else "ready",
            "current_uncertainty": status["current_uncertainty"],
            "prev_uncertainty": status["prev_uncertainty"],
        }, 200


class StatsResource(Resource):
    @cross_origin()
    def get(self):
        # Get all distinct uncertainty values
        uncertainties = Uncertainty.query.with_entities(Uncertainty.value).distinct().all()

        # Convert to a simple list of values
        uncertainty_values = [unc.value for unc in uncertainties]

        # Return as JSON response
        return {'uncertainty_values': uncertainty_values}, 200
