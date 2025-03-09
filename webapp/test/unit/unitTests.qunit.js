/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"hcm.cvi.report.balancing/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
