sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/odata/ODataUtils",
	"hcm/cvi/report/balancing/controller/BaseController"
],
	function (Controller,
	ODataUtils,
	BaseController) {
		"use strict";

		return Controller.extend("hcm.cvi.report.balancing.controller.Main", {
			arrColumn: [],
			arrData: [],
			onInit: function () {
				this.oComponent = this.getOwnerComponent();
				this.oRouter = this.oComponent.getRouter();
				this.oODataModel = this.oComponent.getModel();
				var oModel = new sap.ui.model.json.JSONModel();

				oModel.setData({
					"VisibleReportAnnual": false,
					"visibleBalancing": true
				});

				this.getView().setModel(oModel, "oModel");
			},
			onSearch: function (oEvent) {
				var oSmartFilterBar = oEvent.getSource();
				/** The following code is used only for the purpose of the demo to visualize the filter query
					and since private controls are invoked it shouldn't be used in application scenarios! */
				console.log(oSmartFilterBar);
				console.log(oSmartFilterBar.getFilters());
				this._getDataColumn(oSmartFilterBar.getFilters());
			},
			_getDataColumn: function (oFilter) {
				var e = "/ZHCMCD_CVI_MDQUEST",
					s = this;
				this.oODataModel.read(e, {
					format: "json",
					filters: oFilter,
					success: function (e, t) {
						s._buildcolumn(e.results);

						s._getDataBalancing(oFilter).then(function (columns) {
							s._buildTable(s.arrColumn, s.arrData);
						}).catch(function (error) {
							console.error("Error fetching columns: ", error);
						});
					},
					error: function (e) {
						console.error("Error fetching data: ", e);
					}
				});
			},
			_getDataBalancing: function (oFilter) {
				var e = "/ZHCMCD_CVI_BALANCING",
					s = this;
					this.oODataModel.setUseBatch(false);
				return new Promise(function (o, a) {
					this.oODataModel.read(e, {
						format: "json",
						filters: oFilter,
						sorters: [new sap.ui.model.Sorter("ParticipantId")],
						success: function (e, t) {
							s._buildData(e.results);
							o(e.results);
						},
						error: function (e) {
							a(e);
						}
					});
				}.bind(this))
			},

			_buildcolumn: function (arr) {
				var aColumnData = [];
				var idx = 0;
				var arrGroup = arr;
				aColumnData.push({
					columnId: "ID",
					columnWidth: "100px",
					QuestionGroup: "Employee ID",
				});
				aColumnData.push({
					columnId: "NAME",
					columnWidth: "200px",
					QuestionGroup: "Employee Name",
				});
				aColumnData.push({
					columnId: "DEPT",
					columnWidth: "250px",
					QuestionGroup: "Department",
				});
				arr.forEach(function (column) {
					idx++;
					var span = 0;
					span = arrGroup.filter(cspan => column.QuestionGroup === cspan.QuestionGroup).length;	
					aColumnData.push({
						QuestionId: column.QuestionId,
						QuestionGroup: column.QuestionGroup,
						columnId: "col" + idx,
						columnSpan: span,
						columnWidth: "150px",
						columnText: column.QuestionText
					});
				});
				this.arrColumn = aColumnData;
			},
			_buildData: function (arr) {
				this.arrData = [];
				let rowDataMap = new Map();

				const columnMap = this.arrColumn.reduce((map, column) => {
					map[column.QuestionId] = column.columnId;
					return map;
				}, {});

				arr.forEach(data => {
					if (!rowDataMap.has(data.ParticipantId)) {
						rowDataMap.set(data.ParticipantId, {
							ID: data.ParticipantId
						});
					}
					let rowData = rowDataMap.get(data.ParticipantId);
					if (columnMap[data.QuestionId]) {
						rowData[columnMap[data.QuestionId]] = data.RateId;
					}
				});

				this.arrData = Array.from(rowDataMap.values());
			},
			_buildTable: function (arrColumn, arrData) {
				console.log(arrColumn);
				console.log(arrData);				
				var jsonModel = new sap.ui.model.json.JSONModel();
				jsonModel.setData({
					columns: arrColumn,
					rows: arrData
				});
				var oTable = this.getView().byId("balancingTable");
				oTable.setModel(jsonModel);
				oTable.setFixedColumnCount(1);
				oTable.bindColumns("/columns", function (index, context) {
					var sColumnId = context.getObject().columnId;
					var sMultiLabel = [
						new sap.m.Label({ text: context.getObject().QuestionGroup, textAlign: "Center", width: "100%" }),
						new sap.m.Label({ text: context.getObject().columnText, textAlign: "Center", width: "100%" })
					];
					var sColumnSpan = context.getObject().columnSpan;
					return new sap.ui.table.Column({
						id: sColumnId,
						label: sMultiLabel,
						template: sColumnId,
						width: context.getObject().columnWidth,
						headerSpan: sColumnSpan,
						multiLabels: sMultiLabel,
						sortProperty: sColumnId,
						filterProperty: sColumnId
					});
				});
				oTable.bindRows("/rows");
			},
			onBalancingPress: function () {	
				var oTable = this.getView().byId("balancingTable");
				var aSelectedIndices = oTable.getSelectedIndices();
				if (aSelectedIndices.length === 0) {
					sap.m.MessageToast.show("Please select a row to view details.");
					return;
				}

				var aSelectedData = aSelectedIndices.map(function (index) {
					return oTable.getContextByIndex(index).getObject();
				});

				var oDetailModel = new sap.ui.model.json.JSONModel();
				oDetailModel.setData(aSelectedData);

				if (!this._oDialog) {
					this._oDialog = sap.ui.xmlfragment("hcm.cvi.report.balancing.view.fragments.DetailDialog", this);
					this.getView().addDependent(this._oDialog);
				}

				this._oDialog.setModel(oDetailModel);
				this._oDialog.open();
			},

			onCloseDialog: function () {
				this._oDialog.close();
			},

			onTabBarSelect: function (oEvent) {
				if(oEvent.getSource().getSelectedKey() === "01") {
					this.getView().getModel("oModel").setProperty("/VisibleReportAnnual", false);
					this.getView().getModel("oModel").setProperty("/visibleBalancing", true);
				}
				else {
					this.getView().getModel("oModel").setProperty("/VisibleReportAnnual", true);
					this.getView().getModel("oModel").setProperty("/visibleBalancing", false);
				}
			},
			onDownloadBalancing: function () {
			}
		});
	});
