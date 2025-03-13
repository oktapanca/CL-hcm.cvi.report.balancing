/**
 * eslint-disable @sap/ui5-jsdocs/no-jsdoc
 */

sap.ui.define([
        "sap/ui/core/UIComponent",
        "sap/ui/Device",
        "hcm/cvi/report/balancing/model/models",
        "hcm/cvi/report/balancing/controller/ErrorHandler"
    ],
    function (UIComponent, Device, models, errorHandler) {
        "use strict";

        return UIComponent.extend("hcm.cvi.report.balancing.Component", {
            metadata: {
                manifest: "json"
            },

            /**
             * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
             * @public
             * @override
             */
            init: function () {
                this.oMessageProcessor = new sap.ui.core.message.ControlMessageProcessor;
                this.oMessageManager = sap.ui.getCore().getMessageManager();
                this.oMessageManager.registerMessageProcessor(this.oMessageProcessor);
                this._oErrorHandler = new errorHandler(this, this.oMessageProcessor, this.oMessageManager);
                // call the base component's init function
                UIComponent.prototype.init.apply(this, arguments);

                // enable routing
                this.getRouter().initialize();

                // set the device model
                this.setModel(models.createDeviceModel(), "device");
            },
            destroy: function() {
                this.getErrorHandler().destroy();
                UIComponent.prototype.destroy.apply(this, arguments)
            },
            getContentDensityClass: function() {
                if (this._sContentDensityClass === undefined) {
                    if (jQuery(document.body).hasClass("sapUiSizeCozy") || jQuery(document.body).hasClass("sapUiSizeCompact")) {
                        this._sContentDensityClass = ""
                    } else if (!t.support.touch) {
                        this._sContentDensityClass = "sapUiSizeCompact"
                    } else {
                        this._sContentDensityClass = "sapUiSizeCozy"
                    }
                }
                return this._sContentDensityClass
            },
            getErrorHandler: function() {
                return this._oErrorHandler
            },
        });
    }
);