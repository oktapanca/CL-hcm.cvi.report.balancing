sap.ui.define([], function () {
    "use strict";

    return {

        deleteLeadingZeros: function (value) {
            if (typeof value === "string") {
            return value.replace(/^0+/, '');
            }
            return value;
        }
    };
});