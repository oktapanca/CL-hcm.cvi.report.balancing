sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/odata/ODataUtils",
	"hcm/cvi/report/balancing/controller/BaseController",
	"sap/ui/export/Spreadsheet"
],
	function (Controller,
		ODataUtils,
		BaseController,
		Spreadsheet) {
		"use strict";

		return Controller.extend("hcm.cvi.report.balancing.controller.Main", {
			arrColumnBalancing: [],
			arrDataBalancing: [],
			arrColumnReport: [],
			arrDataReport: [],
			onInit: function () {
				this.oComponent = this.getOwnerComponent();
				this.oRouter = this.oComponent.getRouter();
				this.oODataModel = this.oComponent.getModel();
				var oLocalModel = new sap.ui.model.json.JSONModel();

				oLocalModel.setData({
					"VisibleReportAnnual": false,
					"visibleBalancing": true
				});

				this.getView().setModel(oLocalModel, "oLocalModel");
				this.oErrorHandler = this.oComponent.getErrorHandler()
			},
			onSearchBalancing: function (oEvent) {
				var oSmartFilterBar = oEvent.getSource();
				/** The following code is used only for the purpose of the demo to visualize the filter query
					and since private controls are invoked it shouldn't be used in application scenarios! */
				this._getDataColumnBalancing(oSmartFilterBar.getFilters());
			},
			onSearchReport: function (oEvent) {
				var oSmartFilterBar = oEvent.getSource();
				/** The following code is used only for the purpose of the demo to visualize the filter query
					and since private controls are invoked it shouldn't be used in application scenarios! */
				console.log(oSmartFilterBar);
				var aFilters = oSmartFilterBar.getFilters();
				var sFilterString = ODataUtils.createFilterParams(aFilters, this.oODataModel.oMetadata, this.oODataModel.sServiceUrl);
				sFilterString = sFilterString.replace('$filter=', '');
				console.log(sFilterString);
				console.log(this.parseODataFilter(sFilterString));

			},

			// Function to parse OData $filter into array
			// parseODataFilter: function (filter) {

			// 	// Decode URI components
			// 	const decodedFilter = decodeURIComponent(filter);

			// 	// Split by ' and ' to get each condition
			// 	const conditions = decodedFilter.split(' and ');

			// 	return conditions.flatMap((condition) => {
			// 		// Handle nested parentheses (e.g., OR conditions)
			// 		if (condition.includes('(') && condition.includes(')')) {
			// 			const nestedConditions = condition.match(/\((.*?)\)/g);
			// 			if (nestedConditions) {
			// 				return nestedConditions.map(nested => this.parseODataFilter(nested.replace(/[()]/g, '')));
			// 			}
			// 		}

			// 		// Extract field, operator, and value
			// 		const match = condition.match(/(\w+)\s*(eq|ge|le|substringof|not substringof)\s*(.*)/);

			// 		if (match) {
			// 			let [, field, operator, value] = match;

			// 			// Handle complex values (like substringof where value comes first)
			// 			if (operator.includes('substringof')) {
			// 				const [substring, actualField] = value.replace(/[()]/g, '').split(',');
			// 				field = actualField.trim();
			// 				value = substring.trim();
			// 			}

			// 			// Clean up the value (remove surrounding quotes if present)
			// 			const cleanValue = value.replace(/['"()]/g, '');

			// 			return { field, operator, value: cleanValue };
			// 		}

			// 		return null;
			// 	}).filter(Boolean); // Remove null entries
			// },

			_getDataColumnBalancing: function (oFilter) {
				var e = "/ZHCMCD_CVI_MDQUEST",
					s = this;
				this.oODataModel.read(e, {
					format: "json",
					filters: oFilter,
					success: function (e, t) {
						s._buildColumnBalancing(e.results);

						s._getDataBalancing(oFilter).then(function (columns) {
							s._buildTableBalancing(s.arrColumnBalancing, s.arrDataBalancing);
						}).catch(function (error) {
							console.error("Error fetching columns: ", error);
						});
					},
					error: function (e) {
						console.error("Error fetching data: ", e);
					}
				});
			},
			_getDataColumnReport: function (oFilter) {
				var e = "/ReportAnnualColumnSet",
					s = this;
				var filter = new sap.ui.model.Filter("Filter", sap.ui.model.FilterOperator.EQ, oFilter);
				this.oODataModel.read(e, {
					format: "json",
					filters: filter,
					success: function (e, t) {
						s._buildColumnBalancing(e.results);

						s._getDataBalancing(oFilter).then(function (columns) {
							s._buildTableBalancing(s.arrColumnBalancing, s.arrDataBalancing);
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
							s._buildDataBalancing(e.results);
							o(e.results);
						},
						error: function (e) {
							a(e);
						}
					});
				}.bind(this))
			},

			_buildColumnBalancing: function (arr) {
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
				this.arrColumnBalancing = aColumnData;
			},
			_buildDataBalancing: function (arr) {
				console.log(arr);
				this.arrDataBalancing = [];
				let rowDataMap = new Map();

				const columnMap = this.arrColumnBalancing.reduce((map, column) => {
					map[column.QuestionId] = column.columnId;
					return map;
				}, {});

				arr.forEach(data => {
					if (!rowDataMap.has(data.ParticipantId)) {
						rowDataMap.set(data.ParticipantId, {
							ID: data.ParticipantId,
							EventId: data.EventId
						});
					}
					let rowData = rowDataMap.get(data.ParticipantId);
					if (columnMap[data.QuestionId]) {
						rowData[columnMap[data.QuestionId]] = data.RateId;
					}
				});

				this.arrDataBalancing = Array.from(rowDataMap.values());
			},
			_buildTableBalancing: function (arrColumn, arrData) {
				console.log(arrColumn);
				console.log(arrData);
				var tableModel = new sap.ui.model.json.JSONModel();
				tableModel.setData({
					columns: arrColumn,
					rows: arrData
				});
				var oTable = this.getView().byId("balancingTable");
				oTable.setModel(tableModel);
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

			onTableBalancingSelection: function () {
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
				var sData = aSelectedData[0];
				oDetailModel.setData(sData);
				this.getView().setModel(oDetailModel, "oDetailModel");

				if (!this._oDialog) {
					this._oDialog = sap.ui.xmlfragment("hcm.cvi.report.balancing.view.fragments.DetailDialog", this);
					this.getView().addDependent(this._oDialog);
				}
				this.onGenerateFormDialog(aSelectedData[0]);
				this._oDialog.open();
			},

			onCancelDialog: function () {
				console.log(this.getView().getModel("oDetailModel").getData());
				this._oDialog.close();
			},

			onSaveAsDraftButtonPress: function () {
				var s = this;
				var arrUpdate = [];
				var sUpd = {};
				var sData = this.getView().getModel("oDetailModel").getData();
				console.log(sData);
				var oModel = this.oODataModel;
				sUpd.EventId = sData.EventId;
				console.log(this.arrColumnBalancing);
				this.arrColumnBalancing.forEach(function (column) {
					if (sData[column.columnId]) {
						arrUpdate.push({
							ParticipantId: sData.ID,
							QuestionId: column.QuestionId,
							QuestionGroup: column.QuestionGroup,
							RateId: sData[column.columnId]
						});
					}
				}
				);
				sUpd = {};
				sUpd.EventId = sData.EventId;
				sUpd.ToBalancingProcess = arrUpdate;
				if (arrUpdate.length > 0) {
					this.getView().setBusy(true);
					oModel.create("/EventSet", sUpd, {
						method: "POST",
						success: function (e) {
							sap.m.MessageToast.show("Draft saved successfully.");
							s.getView().setBusy(false);
						},
						error: function (e) {
							s.oErrorHandler.setShowErrors("immediately");
							s.getView().setBusy(false);
						}
					});

					oModel.refresh(true);
				}
				this._oDialog.close();
			},

			onGenerateFormDialog: function (sData) {
				var form = sap.ui.getCore().byId("detailForm");
				console.log(this.arrColumnBalancing);
				this.arrColumnBalancing.forEach(function (column) {
					console.log(column.columnId.substring(0, 3));
					if (column.columnId === "ID" || column.columnId === "NAME") {
						return;
					}
					if (column.columnId.substring(0, 3) === "col") {
						var val = "{oDetailModel>/" + column.columnId + "}";
						form.addContent(new sap.m.Label({ text: column.columnText }));
						form.addContent(new sap.m.Input({ value: val }));
					}
				}
				);
			},

			onTabBarSelect: function (oEvent) {
				if (oEvent.getSource().getSelectedKey() === "01") {
					this.getView().getModel("oLocalModel").setProperty("/VisibleReportAnnual", false);
					this.getView().getModel("oLocalModel").setProperty("/visibleBalancing", true);
				}
				else {
					this.getView().getModel("oLocalModel").setProperty("/VisibleReportAnnual", true);
					this.getView().getModel("oLocalModel").setProperty("/visibleBalancing", false);
				}
			},
			onDownloadBalancing: function () {
				var oTable = this.getView().byId("balancingTable");
				var oModel = oTable.getModel();
				console.log(this.arrColumnBalancing);
				var aCols = this.arrColumnBalancing.map(function (col) {
					if (col.columnText === undefined) {
						return {
							label: `${col.QuestionGroup}`,
							property: col.columnId,
							type: 'string'
						};
					} else {
						return {
							label: `${col.QuestionGroup}-${col.columnText}`,
							property: col.columnId,
							type: 'string'
						};
					}
				});
				var oSettings = {
					workbook: { columns: aCols },
					dataSource: oModel.getProperty("/rows"),
					fileName: "BalancingData.xlsx",
					sheetName: "BalancingData" // Optional
				};
				var oSheet = new Spreadsheet(oSettings);
				oSheet.build().finally(function () {
					oSheet.destroy();
				});
			}
		});
	});
