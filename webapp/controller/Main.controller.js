sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/odata/ODataUtils",
	"hcm/cvi/report/balancing/controller/BaseController",
	"sap/ui/export/Spreadsheet",
	"sap/m/Button"
],
	function (Controller,
	ODataUtils,
	BaseController,
	Spreadsheet,
	Button) {
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
			onSearchBalancing: function () {
				var oSmartFilterBar = this.getView().byId("smartFilterBalancing");
				this._getDataColumnBalancing(oSmartFilterBar.getFilters());
			},
			onSearchReport: function (oEvent) {
				var oSmartFilterBar = oEvent.getSource();
				var aFilters = oSmartFilterBar.getFilters();
				this._getDataReport(oSmartFilterBar.getFilters());
			},

			_getDataColumnBalancing: function (oFilter) {
				var e = "/ZHCMCD_CVI_MDQUEST",
					s = this;
				s.getView().setBusy(true);
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
						s.getView().setBusy(false);
						console.error("Error fetching data: ", e);
					}
				});
			},
			_getDataBalancing: function (oFilter) {
				var e = "/ZHCMCD_CVI_BALANCINGPROCESS",
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
			_getDataReport: function (oFilter) {
				var e = "/ZHCMCD_CVI_ANNUALREPORT",
					s = this;
				this.oODataModel.setUseBatch(false);
				return new Promise(function (o, a) {
					this.oODataModel.read(e, {
						format: "json",
						filters: oFilter,
						sorters: [new sap.ui.model.Sorter("ParticipantId")],
						success: function (e, t) {
							s._buildDataReport(e.results);
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
					columnId: "SEL",
					columnWidth: "50px",
					QuestionGroup: "",
				});
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
				aColumnData.push({
					columnId: "VERSION",
					columnWidth: "80px",
					QuestionGroup: "Version",
				});
				// console.log(arr);
				arr.forEach(function (column) {
					idx++;
					var span = 0;
					span = arrGroup.filter(cspan => column.QuestionGroup === cspan.QuestionGroup).length;
					aColumnData.push({
						QuestionId: column.QuestionId,
						QuestionGroup: column.QuestionGroup,						
						Editable: column.Editable,
						columnId: "col" + idx,
						columnSpan: span,
						columnWidth: "150px",
						columnText: column.QuestionText
					});
				});
				aColumnData.push({
					columnId: "TotalRate",
					columnWidth: "100px",
					QuestionGroup: "Total Rate",
				});
				aColumnData.push({
					columnId: "AvgRate",
					columnWidth: "80px",
					QuestionGroup: "Average",
				});
				aColumnData.push({
					columnId: "Counting",
					columnWidth: "80px",
					QuestionGroup: "Count",
				});
				aColumnData.push({
					columnId: "MinRate",
					columnWidth: "80px",
					QuestionGroup: "Min Rate",
				});
				aColumnData.push({
					columnId: "Criteria",
					columnWidth: "180px",
					QuestionGroup: "Criteria",
				});
				aColumnData.push({
					columnId: "NewCriteria",
					columnWidth: "180px",
					QuestionGroup: "New Criteria",
				});
				aColumnData.push({
					columnId: "FinalCriteria",
					columnWidth: "180px",
					QuestionGroup: "Final Criteria",
				});
				this.arrColumnBalancing = aColumnData;
			},
			_buildDataBalancing: function (arr) {
				this.arrDataBalancing = [];
				let rowDataMap = new Map();

				const columnMap = this.arrColumnBalancing.reduce((map, column) => {
					map[column.QuestionId] = column.columnId;
					return map;
				}, {});

				arr.forEach(data => {
					if (!rowDataMap.has(data.ParticipantId.replace(/^0+/, ''))) {
						rowDataMap.set(data.ParticipantId.replace(/^0+/, ''), {
							SEL: "sap-icon://edit",
							ID: data.ParticipantId.replace(/^0+/, ''),
							NAME: data.ParticipantName,
							DEPT: data.ParticipantDeptDesc,
							VERSION: data.Version.replace(/^0+/, ''),
							TotalRate: data.TotalRate,
							AvgRate: data.AvgRate,
							Counting: data.Counting,
							MinRate: data.MinRate,
							Criteria: data.Criteria,
							NewCriteria: data.NewCriteria,
							FinalCriteria: data.FinalCriteria,

							EventId: data.EventId
						});
					}
					let rowData = rowDataMap.get(data.ParticipantId.replace(/^0+/, ''));
					if (columnMap[data.QuestionId]) {
						rowData[columnMap[data.QuestionId]] = data.RateId;
					}
				});

				this.arrDataBalancing = Array.from(rowDataMap.values());
			},

			_buildDataReport: function (arr) {
				this.arrColumnReport = [];
				this.arrDataReport = [];
				let columnReport = [];
				let columnMap = new Map();
				let idx = 0;

				arr.forEach(data => {
					let columnKey = `${data.EventId}-${data.QuestionGroup}-${data.QuestionId}`;
					if (!columnMap.has(columnKey)) {
						let row = {
							EventId: data.EventId,
							QuestionGroup: data.QuestionGroup,
							QuestionId: data.QuestionId,
							EventName: data.EventName,
							QuestionDesc: data.QuestionDesc,
							seq: data.seq,
							columnKey: columnKey
						};
						columnMap.set(columnKey, row);

						columnReport.push(row);
					}
				});

				columnReport.sort((a, b) => {
					if (a.EventId < b.EventId) {
						return -1;
					}
					if (a.EventId > b.EventId) {
						return 1;
					}
					if (a.seq < b.seq) {
						return -1;
					}
					if (a.seq > b.seq) {
						return 1;
					}
					// if (!a.QuestionId || !a.QuestionGroup) {
					// 	return 1;
					// }
					// if (!b.QuestionId || !b.QuestionGroup) {
					// 	return -1;
					// }
					if (a.QuestionGroup < b.QuestionGroup) {
						return -1;
					}
					if (a.QuestionGroup > b.QuestionGroup) {
						return 1;
					}
					if (a.QuestionId < b.QuestionId) {
						return -1;
					}
					if (a.QuestionId > b.QuestionId) {
						return 1;
					}
					return 0;
				});

				this.arrColumnReport.push({
					columnId: "ID",
					columnWidth: "100px",
					QuestionGroup: "Employee ID",
				});
				this.arrColumnReport.push({
					columnId: "NAME",
					columnWidth: "200px",
					QuestionGroup: "Employee Name",
				});
				this.arrColumnReport.push({
					columnId: "DEPT",
					columnWidth: "250px",
					QuestionGroup: "Department",
				});
				this.arrColumnReport.push({
					columnId: "VERSION",
					columnWidth: "100px",
					QuestionGroup: "Version",
				});

				columnReport.forEach(data => {
					idx++;
					let span = columnReport.filter(c => c.EventId === data.EventId).length;
					let row = {
						columnId: `col${idx}`,
						columnWidth: "150px",
						EventId: data.EventId,
						QuestionGroup: data.QuestionGroup,
						QuestionId: data.QuestionId,
						EventName: data.EventName,
						QuestionDesc: data.QuestionDesc,
						columnKey: data.columnKey,
						columnSpan: span
					};
					this.arrColumnReport.push(row);
				});


				let rowDataMap = new Map();

				columnMap = this.arrColumnReport.reduce((map, column) => {
					map[column.columnKey] = column.columnId;
					return map;
				}, {});

				arr.forEach(data => {
					if (!rowDataMap.has(data.ParticipantId.replace(/^0+/, ''))) {
						rowDataMap.set(data.ParticipantId.replace(/^0+/, ''), {
							ID: data.ParticipantId.replace(/^0+/, ''),
							NAME: data.ParticipantName,
							DEPT: data.ParticipantDeptDesc,
							VERSION: data.Version.replace(/^0+/, '')
						});
					}
					let rowData = rowDataMap.get(data.ParticipantId.replace(/^0+/, ''));
					let columnKey = `${data.EventId}-${data.QuestionGroup}-${data.QuestionId}`;
					if (columnMap[columnKey]) {
						rowData[columnMap[columnKey]] = data.BalanceResult;
					}
				});

				this.arrDataReport = Array.from(rowDataMap.values());

				this._buildTableReport(this.arrColumnReport, this.arrDataReport);
			},

			_buildTableBalancing: function (arrColumn, arrData) {
				var s = this;
				var tableModel = new sap.ui.model.json.JSONModel();
				tableModel.setData({
					columns: arrColumn,
					rows: arrData
				});
				var oTable = this.getView().byId("balancingTable");
				oTable.setModel(tableModel);
				oTable.setFixedColumnCount(2);
				oTable.bindColumns("/columns", function (index, context) {
					var sColumnId = context.getObject().columnId;
					var sMultiLabel = [
						new sap.m.Label({ text: context.getObject().QuestionGroup, textAlign: "Center", width: "100%" }),
						new sap.m.Label({ text: context.getObject().columnText, textAlign: "Center", width: "100%" })
					];
					var template = new sap.m.Text({
						text: `{${sColumnId}}`,
						wrapping: false
					});
					if (sColumnId === "SEL") {
						template = new sap.m.Button({
							icon: "sap-icon://edit",
							type: "Transparent",
							press: function (oEvent) {
								s.onIconTableBalancingSelection(oEvent);
							}.bind(this)
						});
					}
					var sColumnSpan = context.getObject().columnSpan;
					return new sap.ui.table.Column({
						id: "balancingTableColumn_" + sColumnId,
						label: sMultiLabel,
						template: template,
						width: context.getObject().columnWidth,
						headerSpan: sColumnSpan,
						multiLabels: sMultiLabel,
						sortProperty: sColumnId,
						filterProperty: sColumnId
					});
				});
				oTable.bindRows("/rows");
				oTable.getColumns().forEach(function (oColumn) {
					// console.log(oColumn);
					// oColumn.setStyleClass("customColumnStyle");
				});
				this.getView().setBusy(false);
			},

			_buildTableReport: function (arrColumn, arrData) {
				var tableModel = new sap.ui.model.json.JSONModel();
				tableModel.setData({
					columns: arrColumn,
					rows: arrData
				});
				var oTable = this.getView().byId("reportTable");
				oTable.setModel(tableModel);
				oTable.setFixedColumnCount(1);
				oTable.bindColumns("/columns", function (index, context) {
					var sColumnId = context.getObject().columnId;
					var sMultiLabel = [
						new sap.m.Label({ text: context.getObject().EventName, textAlign: "Center", width: "100%" }),
						new sap.m.Label({ text: context.getObject().QuestionGroup, textAlign: "Center", width: "100%" }),
						new sap.m.Label({ text: context.getObject().QuestionDesc, textAlign: "Center", width: "100%" })
					];
					var sColumnSpan = context.getObject().columnSpan;
					return new sap.ui.table.Column({
						// id: sColumnId,
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

			onIconTableBalancingSelection: function (oEvent) {
				var oTable = this.getView().byId("balancingTable");
				var oRowContext = oEvent.getSource().getBindingContext();
				console.log(oRowContext);
				var oRowData = oRowContext.getObject();
				console.log(oRowData);
				this.onBalancingProcess(oRowData);
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
				this.onBalancingProcess(aSelectedData[0]);
			},

			onBalancingProcess: function (sData) {				
				var oDetailModel = new sap.ui.model.json.JSONModel();
				Object.keys(sData).forEach(function (key) {
					if (key.startsWith("col")) {
						sData[key + "_old"] = sData[key];
					}
				});
				sData["Total"] = 0;
				sData["Min"] = 0;
				sData["Max"] = 0;
				sData["Average"] = 0;
				sData["Count"] = 0;
				sData["Total_old"] = sData["TotalRate"];
				sData["Min_old"] = sData["MinRate"];
				sData["Average_old"] = sData["AvgRate"];
				sData["Count_old"] = sData["Counting"];
				sData["Criteria_old"] = sData["Criteria"];
				sData["NewCriteria_old"] = sData["NewCriteria"];
				sData["FinalCriteria_old"] = sData["FinalCriteria"];
				sData["Comment"] = "";
				oDetailModel.setData(sData);

				this.getView().setModel(oDetailModel, "oDetailModel");
				this.onCalculateRating();

				if (!this._oDialog) {
					this._oDialog = sap.ui.xmlfragment("hcm.cvi.report.balancing.view.fragments.DetailDialog", this);
					this.getView().addDependent(this._oDialog);
				}
				this.onGenerateFormDialog(sData);
				this._oDialog.open();
			},

			onCancelDialog: function () {
				var sData = this.getView().getModel("oDetailModel").getData();
				Object.keys(sData).forEach(function (key) {
					if (key.startsWith("col") && !key.endsWith("_old")) {
						sData[key] = sData[key + "_old"];
					}
				});
				this.getView().getModel("oDetailModel").setData(sData);
				this._oDialog.close();
			},

			onGenerateFormDialog: function (sData) {
				var form = sap.ui.getCore().byId("detailForm");
				var s = this;
				form.destroyContent();
				// console.log(this.arrColumnBalancing);
				this.arrColumnBalancing.forEach(function (column) {
					if (column.columnId === "ID" || column.columnId === "NAME") {
						return;
					}
					if (column.columnId.substring(0, 3) === "col") {
						var val = "{oDetailModel>/" + column.columnId + "}";
						var val_old = "{oDetailModel>/" + column.columnId + "_old}";
						form.addContent(new sap.m.Label({ text: column.columnText }));
						form.addContent(new sap.m.Input({
							value: val_old,
							editable: false,
							layoutData: new sap.ui.layout.GridData({
								span: "XL1 L1 M2 S4"
							})
						}));
						let sEditable = true;
						if (column.Editable === "" || column.Editable === false) {
							sEditable = false;
						}
						form.addContent(new sap.m.Input({ value: val, editable: sEditable, type: "Number", change: s.onRatingValueChange.bind(s) }));
					}
				});

				form.addContent(new sap.m.Label({ text: "Total" }));
				form.addContent(new sap.m.Input({
					value: "{oDetailModel>/Total_old}",
					editable: false,
					layoutData: new sap.ui.layout.GridData({
						span: "XL1 L1 M2 S4"
					}),
					type: "Number"
				}));
				form.addContent(new sap.m.Input({ value: "{oDetailModel>/Total}", editable: false, type: "Number" }));

				form.addContent(new sap.m.Label({ text: "Average" }));
				form.addContent(new sap.m.Input({
					value: "{oDetailModel>/Average_old}",
					editable: false,
					layoutData: new sap.ui.layout.GridData({
						span: "XL1 L1 M2 S4"
					}),
					type: "Number"
				}));
				form.addContent(new sap.m.Input({ value: "{oDetailModel>/Average}", editable: false, type: "Number" }));

				form.addContent(new sap.m.Label({ text: "Minimum" }));
				form.addContent(new sap.m.Input({
					value: "{oDetailModel>/Min_old}",
					editable: false,
					layoutData: new sap.ui.layout.GridData({
						span: "XL1 L1 M2 S4"
					}),
					type: "Number"
				}));
				form.addContent(new sap.m.Input({ value: "{oDetailModel>/Min}", editable: false, type: "Number" }));

				form.addContent(new sap.m.Label({ text: "Count" }));
				form.addContent(new sap.m.Input({
					value: "{= Math.floor(${oDetailModel>/Count_old}) }",
					editable: false,
					layoutData: new sap.ui.layout.GridData({
						span: "XL1 L1 M2 S4"
					}),
					type: "Number"
				}));
				form.addContent(new sap.m.Input({ value: "{= Math.floor(${oDetailModel>/Count}) }", editable: false, type: "Number" }));


				form.addContent(new sap.m.Label({ text: "Criteria" }));
				// form.addContent(new sap.m.Input({
				// 	value: "{oDetailModel>/Criteria_old}",
				// 	editable: false,
				// 	layoutData: new sap.ui.layout.GridData({
				// 		span: "XL2 L2 M2 S4"
				// 	})
				// }));
				form.addContent(new sap.m.Input({ value: "{oDetailModel>/Criteria}", editable: false }));


				form.addContent(new sap.m.Label({ text: "New Criteria" }));
				// form.addContent(new sap.m.Input({
				// 	value: "{oDetailModel>/NewCriteria_old}",
				// 	editable: false,
				// 	layoutData: new sap.ui.layout.GridData({
				// 		span: "XL2 L2 M2 S4"
				// 	})
				// }));
				form.addContent(new sap.m.Input({ value: "{oDetailModel>/NewCriteria}", editable: false }));


				form.addContent(new sap.m.Label({ text: "Final Criteria" }));
				// form.addContent(new sap.m.Input({
				// 	value: "{oDetailModel>/FinalCriteria_old}",
				// 	editable: false,
				// 	layoutData: new sap.ui.layout.GridData({
				// 		span: "XL2 L2 M2 S4"
				// 	})
				// }));
				form.addContent(new sap.m.Input({ value: "{oDetailModel>/FinalCriteria}", editable: false }));
			},

			onRatingValueChange: function (oEvent) {
				var oInput = oEvent.getSource();
				var sValue = oInput.getValue();
				if (sValue < 0 || sValue > 5) {
					oInput.setValueState("Error");
					oInput.setValueStateText("Value must be between 0 and 5");
					return;
				} else {
					oInput.setValueState("None");
				}
				this.onCalculateRating();
			},

			onCalculateRating: function () {
				var s = this;
				var arrUpdate = [];
				var sUpd = {};
				var sData = s.getView().getModel("oDetailModel").getData();
				var oModel = s.oODataModel;
				this.arrColumnBalancing.forEach(function (column) {
					if (sData[column.columnId] && column.columnId.substring(0, 3) === "col") {
						arrUpdate.push({
							EventId: sData.EventId,
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
				sUpd.ToCalculateBalancing = [];
				if (arrUpdate.length > 0) {
					oModel.create("/EventSet", sUpd, {
						method: "POST",
						success: function (e) {
							if (e.ToCalculateBalancing.results.length > 0) {
								sData["Total"] = e.ToCalculateBalancing.results[0].Total;
								sData["Min"] = e.ToCalculateBalancing.results[0].Min;
								sData["Max"] = e.ToCalculateBalancing.results[0].Max;
								sData["Average"] = e.ToCalculateBalancing.results[0].Average;
								sData["Count"] = e.ToCalculateBalancing.results[0].Count;
								sData["Criteria"] = e.ToCalculateBalancing.results[0].Criteria;
								sData["NewCriteria"] = e.ToCalculateBalancing.results[0].New_Criteria;
								sData["FinalCriteria"] = e.ToCalculateBalancing.results[0].Final_Criteria;
								s.getView().getModel("oDetailModel").setData(sData);
							}
						},
						error: function (e) {
						}
					});
				}
			},

			onCommentTextAreaLiveChange: function (oEvent) {
				var oTextArea = oEvent.getSource();
				var sValue = oTextArea.getValue();
				if (sValue === "") {
					oTextArea.setValueState("Error");
					oTextArea.setValueStateText("Please enter note message");
				} else {
					oTextArea.setValueState("None");
				}
			},

			onSaveBalancingButtonPress: function () {
				var s = this;
				var arrUpdate = [];
				var sUpd = {};
				var sData = s.getView().getModel("oDetailModel").getData();
				var oModel = s.oODataModel;

				if (sData["Comment"] === "") {
					sap.ui.getCore().byId("commentBalancing").setValueState("Error");
					sap.m.MessageToast.show("Please enter note message");
					return;
				}

				// Check if any input fields have error state
				var hasError = false;
				sap.ui.getCore().byId("detailForm").getContent().forEach(function (control) {
					if (control.getValueState && control.getValueState() === "Error") {
						hasError = true;
					}
				});

				if (hasError) {
					sap.m.MessageToast.show("Please correct the errors before saving.");
					return;
				}

				if(sData.VERSION !== '000'){			
					// Check if any changes were made
					var hasChanges = false;
					s.arrColumnBalancing.forEach(function (column) {
						if (column.columnId.substring(0, 3) === "col" && !column.columnId.endsWith("_old")) {
							if (sData[column.columnId] !== sData[column.columnId + "_old"]) {
								hasChanges = true;
							}
						}
					});
				
					if (!hasChanges) {
						sap.m.MessageToast.show("No changes detected. Please make changes before saving.");
						return;
					}					
				}

				sap.m.MessageBox.confirm("Are you sure you want to save the changes?", {
					actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
					onClose: function (oAction) {
						if (oAction === sap.m.MessageBox.Action.YES) {
							s.arrColumnBalancing.forEach(function (column) {
								if (column.columnId.substring(0, 3) === "col" && !column.columnId.endsWith("_old")) {
									arrUpdate.push({
										EventId: sData.EventId,
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
							sUpd.Mode = 'C';
							sUpd.Comment = sData["Comment"];
							sUpd.ToBalancingProcess = arrUpdate;
							if (arrUpdate.length > 0) {
								s.getView().setBusy(true);
								oModel.create("/EventSet", sUpd, {
									method: "POST",
									success: function (e) {
										s.getView().setBusy(false);
										sap.m.MessageToast.show("Balancing data saved successfully");
										s._oDialog.close();
										s.onSearchBalancing();
									},
									error: function (e) {
										s.getView().setBusy(false);
										s._oDialog.close();
									}
								});
							}
						}
					}
				});
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
				function trimHyphens(str) {
					str = str.replace(/^(undefined)+|(undefined)+$/g, '');
					return str.replace(/^-+|-+$/g, '');
				}
				var oTable = this.getView().byId("balancingTable");
				var oModel = oTable.getModel();
				var aCols = this.arrColumnBalancing.map(function (col) {
					let label = `${col.QuestionGroup}-${col.columnText}`;
					return {
						label: trimHyphens(label),
						property: col.columnId,
						type: 'string'
					};
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
			},

			onDownloadReport: function () {
				function trimHyphens(str) {
					str = str.replace(/^(undefined)+|(undefined)+$/g, '');
					return str.replace(/^-+|-+$/g, '');
				}
				var oTable = this.getView().byId("reportTable");
				var oModel = oTable.getModel();
				var aCols = this.arrColumnReport.map(function (col) {
					let label = `${col.EventName}-${col.QuestionGroup}-${col.QuestionDesc}`;
					return {
						label: trimHyphens(label),
						property: col.columnId,
						type: 'string'
					};
				});
				var oSettings = {
					workbook: { columns: aCols },
					dataSource: oModel.getProperty("/rows"),
					fileName: "ReportData.xlsx",
					sheetName: "ReportData" // Optional
				};
				var oSheet = new Spreadsheet(oSettings);
				oSheet.build().finally(function () {
					oSheet.destroy();
				});
			},


		});
	});
