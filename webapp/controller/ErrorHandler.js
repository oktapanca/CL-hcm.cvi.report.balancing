sap.ui.define([
	"sap/ui/base/Object",
	"sap/m/MessageBox"
], function (UI5Object, MessageBox) {
	"use strict";

	return UI5Object.extend("hcm.cvi.report.balancing.controller.ErrorHandler", {

		/**
		 * Handles application errors by automatically attaching to the model events and displaying errors when needed.
		 * @class
		 * @param {sap.ui.core.UIComponent} oComponent reference to the app's component
		 * @public
		 * @alias hcm.cvi.report.balancing.controller.ErrorHandler
		 */
		constructor: function (oComponent) {
			this._oResourceBundle = oComponent.getModel("i18n").getResourceBundle();
			this._oComponent = oComponent;
			this._oModel = oComponent.getModel();
			this._bMessageOpen = false;
			this._sErrorText = this._oResourceBundle.getText("errorText");

			this._oModel.attachMetadataFailed(function (oEvent) {
				var oParams = oEvent.getParameters();
				// this._showServiceError(oParams.response);
			}, this);

			this._oModel.attachRequestFailed(function (oEvent) {
				var oParams = oEvent.getParameters();
				// An entity that was not found in the service is also throwing a 404 error in oData.
				// We already cover this case with a notFound target so we skip it here.
				// A request that cannot be sent to the server is a technical error that we have to handle though
				if (oParams.response.statusCode !== "404" || (oParams.response.statusCode === 404 && oParams.response.responseText.indexOf(
					"Cannot POST") === 0)) {
					this._showServiceError(oParams.response);
				}
			}, this);
		},

		/**
		 * Shows a {@link sap.m.MessageBox} when a service call has failed.
		 * Only the first error message will be display.
		 * @param {string} sDetails a technical error to be displayed on request
		 * @private
		 */
		_showServiceError: function (mResponse) {
			console.log(mResponse);
			if (this._bMessageOpen) {
				return;
			}
			var oMsg = this._sErrorText;
			try {
				var obj = JSON.parse(mResponse["responseText"]);
				oMsg = obj.error.message.value;

			} catch (err) {
			}

			this._bMessageOpen = true;
			MessageBox.error(
				oMsg,
				{
					id: "serviceErrorMessageBox",
					details: mResponse,
					styleClass: this._oComponent.getContentDensityClass(),
					actions: [MessageBox.Action.CLOSE],
					onClose: function () {
						this._bMessageOpen = false;
					}.bind(this)
				}
			);

			if (this._bMessageOpen) {
				return;
			}
			this._bMessageOpen = true;
			var aDetails = JSON.parse(mResponse.responseText);
			//MessageBox.error(this._sErrorText + " " + aDetails.error.message.value);
			MessageBox.error(aDetails.error.message.value);
			this._bMessageOpen = false;
		},
		clearErrors: function () {
			this._oMessageManager.removeAllMessages()
		},
		setShowErrors: function (e) {
			this._showErrors = e
		},
		pushError: function (e) {
			if (e) {
				this._aErrors.push(e)
			}
		},
		hasPendingErrors: function () {
			return this._aErrors.length > 0
		},
		displayErrorPopup: function () {
			if (this._aErrors.length === 0) {
				return false
			}
			var e = this._aErrors.join("\n");
			this._showServiceError(e);
			this._aErrors = [];
			return true
		}

	});

});