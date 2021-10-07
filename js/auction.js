var chJSON = [], chName = [], arAnalysis = [], strAnalysis = "", intDay = 86400000, shSize = { 'Awarded': 0, 'Volume': 0, 'Sertificate': 0 }; //chData = []
const EXCEL_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
const EXCEL_EXTENSION = ".xlsx";

function getDateStr(Date1) {
	var Y, M, D, strDate; Y = Date1.getFullYear(); M = parseInt(Date1.getMonth()) + 1; D = Date1.getDate();
	strDate = Y + "-" + M + "-" + D;
	return strDate;
}

function getSertificate(arSertificate) {
	var chSertificate = {};
	for (let i = 0; i < arSertificate.length; i++) {
		var BalanceGroupAlias = arSertificate[i].BalanceGroupAlias;//: "BURSHTPP-BEI"
		var Direction = arSertificate[i].Direction;//: "range"
		var Product = arSertificate[i].Product;//: "aFRR"
		var Sertificate = arSertificate[i].Sertificate;//: 388
		var key = BalanceGroupAlias + "_" + Product + "_" + Direction;
		if (Sertificate == "-") Sertificate = 0;
		chSertificate[key] = Sertificate;
	}
	return chSertificate;
}

function getPeriod(nameFile) {
	var arD = nameFile.split("_"), iDate = 0;
	while (arD[iDate].split(".").length <= 1) {
		iDate++; //визначаємо частину назви файлу що віповідає за дату
	}
	var aD1 = arD[iDate].split("."), aD2 = arD[iDate + 1].split("."), D1, D2, P;
	var arPeriod = { 'Name': nameFile, 'Period': 'day', 'Date1': '-', 'Date2': '-' };
	arPeriod.Date1 = new Date("20" + aD1[2], parseInt(aD1[1]) - 1, parseInt(aD1[0]));
	arPeriod.Date2 = new Date(arPeriod.Date1);
	if (aD2.length > 2) {
		arPeriod.Date2 = new Date("20" + aD2[2], parseInt(aD2[1]) - 1, parseInt(aD2[0]));
		P = (arPeriod.Date2 - arPeriod.Date1) / intDay;
		arPeriod.Period = "week";
		if (P > 7 && P <= 32) { arPeriod.Period = "month"; }
		if (P > 32 && P <= 95) { arPeriod.Period = "quarter"; }
		if (P > 95) { arPeriod.Period = "year"; }
	}
	return arPeriod;
}

function getProduct(ProductAlias) {
	var P, D, T, arP = ProductAlias.split("_"), p = arP[0], d = arP[1], t = arP[2];
	var aD = { 'з': 'up', 'р': 'down', 'с': 'both' }, aP = { 'РПЧ': 'FCR', 'аРВЧ': 'aFRR', 'рРВЧ': 'mFRR', 'РЗ': 'RR' };
	P = aP[p]; D = aD[d]; T = parseInt(t);
	var arProduct = { 'Product': P, 'Direction': D, 'Time': T };
	return arProduct;
}

//*****************************************************************************************************************************
//**  3.1   https://habr.com/ru/post/423035/                                                                                 **
//** Ввід даних телеметрії : Завантаження файлів - всі формати                                                               **
function UploadFile(idInput) {
	var idForm = "form" + idInput, idFile = "file" + idInput, idMsg = "msg" + idInput, idLab = "label" + idInput;
	var uForm = document.getElementById(idForm), uFile = document.getElementById(idFile);
	var uMsg = document.getElementById("content__table"), uLab = document.getElementById(idLab);

	uForm.addEventListener("drag", function () { return false; });
	uForm.addEventListener("dragstart", function () { return false; });
	uForm.addEventListener("dragend", function () { return false; });
	uForm.addEventListener("dragover", function () { return false; });
	uForm.addEventListener("dragenter", function () { return false; });
	uForm.addEventListener("dragleave", function () { return false; });
	uForm.addEventListener("drop", function () { return false; });

	uForm.addEventListener("dragover", function () { uForm.classList.add('dragover'); });
	uForm.addEventListener("dragenter", function () { uForm.classList.add('dragover'); });
	uForm.addEventListener("dragleave", function (e) { uForm.classList.remove('dragover'); });
	uForm.addEventListener("dragleave", function (e) {
		let dx = e.pageX - uForm.offsetLeft;
		let dy = e.pageY - uForm.offsetTop;
		if ((dx < 0) || (dx > uForm.width) || (dy < 0) || (dy > uForm.height)) {
			uForm.classList.remove('dragover');
		};
	});
	uForm.addEventListener("drop", function (e) { uForm.classList.remove('dragover'); });
	uFile.addEventListener("change", function () {
		let files = this.files, idUpload = this.id.split("file")[1];
		uploadAuction(files, idUpload);
	});

	function closeMessage() {
		//uMsg.setAttribute('class', 'message_hidden'); 
		uMsg.innerHTML = '';
	}	//Закрываем сообщение message message_hidden
	function showMessage(data) {
		if (data == 0) { data = "Завантаження..."; } else { setTimeout(closeMessage, 1000); }
		uMsg.innerHTML = data; //uMsg.setAttribute('class', 'message-div');
	}

	function uploadAuction(allFile, idUpload) {
		var allFile, Name, iName, strMsg = "";
		showMessage(0);
		iName = 0; content__table.innerHTML = idUpload + "<br>"; chName[idUpload] = []; chJSON[idUpload] = [];
		menu_upload.classList.remove('menu__element_upload-on');
		countUpload.innerHTML = 0;
		//allFile = event.target.files;
		for (var i = 0; i < allFile.length; i++) {
			chJSON[idUpload][i] = {};
			chName[idUpload][i] = allFile[i].name;
			var fileReader = new FileReader(), uCount = document.getElementById("count" + idUpload);
			fileReader.onload = function (event) {
				var data = event.target.result;
				var workbook = XLSX.read(data, { type: 'binary' });
				workbook.SheetNames.forEach(sheet => {
					Name = chName[idUpload][iName];
					chJSON[idUpload][iName] = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheet]);
					var size = parseInt(chJSON[idUpload][iName].length);
					strMsg = strMsg + + (iName + 1) + ". " + Name + " - " + size + "<br>";
					showMessage(strMsg);
					iName++;
					shSize[idUpload] = shSize[idUpload] + size;
					uCount.innerHTML = shSize[idUpload]; countUploadAuction.innerHTML = parseInt(countAwarded.innerHTML) + parseInt(countVolume.innerHTML);
				});
				if (shSize.Awarded > 0 && shSize.Sertificate > 0) { menu_concolidate.classList.add('menu__element_concolidate-on'); }
				if (shSize.Awarded > 0) { menu_uploadauction.classList.add('menu__element_upload-on'); }
			};
			fileReader.readAsBinaryString(allFile[i]);
		}
	}
}

//menu_upload.classList.remove('menu__element_upload-on');
//countUpload.innerHTML = 0;
//menu_uploadauction.classList.remove('menu__element_upload-on');
//countUploadAuction.innerHTML = 0;

//consolidation		
function consolidateData() {
	if (shSize.Awarded > 0 && shSize.Sertificate > 0) {
		var chAnalysis = {};
		for (var ID in chName) {
			if (ID != "Sertificate") {
				for (var i = 0; i < chName[ID].length; i++) {
					for (var j = 0; j < chJSON[ID][i].length; j++) {
						var arPeriod = getPeriod(chName[ID][i]);
						//var Date1 = new Date(arPeriod.Date1), Date2 = new Date(arPeriod.Date2), Period = arPeriod.Period;
						var Date1 = arPeriod.Date1, Date2 = arPeriod.Date2, Period = arPeriod.Period;
						var chJ = chJSON[ID][i][j];
						var TPP = chJ.BalanceGroupAlias;
						var arProduct = getProduct(chJ.ProductAlias), Product = arProduct.Product;
						var Direction = arProduct.Direction, Time = arProduct.Time;
						var Volume = parseInt(chJ.Volume); //Value = parseInt(chJ.Volume); if (ID == "Awarded") { Value = parseInt(chJ.AwardedAmount); }

						while (Date1 <= Date2) {
							var strDate = getDateStr(Date1);
							if (!chAnalysis[TPP]) chAnalysis[TPP] = {};
							if (!chAnalysis[TPP][strDate]) chAnalysis[TPP][strDate] = {};
							if (!chAnalysis[TPP][strDate][Time]) chAnalysis[TPP][strDate][Time] = {};
							if (!chAnalysis[TPP][strDate][Time][Product]) chAnalysis[TPP][strDate][Time][Product] = {};
							if (!chAnalysis[TPP][strDate][Time][Product][Direction]) chAnalysis[TPP][strDate][Time][Product][Direction] = {};
							if (!chAnalysis[TPP][strDate][Time][Product][Direction][ID]) chAnalysis[TPP][strDate][Time][Product][Direction][ID] = {};
							if (!chAnalysis[TPP][strDate][Time][Product][Direction][ID][Period]) chAnalysis[TPP][strDate][Time][Product][Direction][ID][Period] = 0;

							chAnalysis[TPP][strDate][Time][Product][Direction][ID][Period] = chAnalysis[TPP][strDate][Time][Product][Direction][ID][Period] + Volume;

							Date1.setDate(Date1.getDate() + 1);
						}
					}
				}
			}
		}
		//processing
		//setTimeout(processingData(chAnalysis), 2000);
		processingData(chAnalysis);

		menu_concolidate.classList.remove('menu__element_concolidate-on');
		chJSON.splice(0, chJSON.length); chName.splice(0, chName.length);

		fileAwarded.Value = ""; fileVolume.Value = ""; fileSertificate.Value = "";
		fileAwarded.type = ""; fileVolume.type = ""; fileSertificate.type = "";
		fileAwarded.type = "file"; fileVolume.type = "file"; fileSertificate.type = "file";
		fileAwarded.value = ""; fileVolume.value = ""; fileSertificate.value = "";

		shSize.Awarded = 0; shSize.Volume = 0; shSize.Sertificate = 0;
		countAwarded.innerHTML = 0; countVolume.innerHTML = 0; countSertificate.innerHTML = 0;
		menu_upload.classList.add('menu__element_upload-on');
	}
}

//processing
function processingData(chAnalysis) {
	var chStructure = {
		'Date': '-',
		'Time': '-',
		'TPP': '-',
		'Product': '-',
		'Direction': '-',
		'Auction': '-',
		'Sertificate': '-',
		'Status': '-',

		'up_Volume_day': 0,
		'up_Volume_week': 0,
		'up_Volume_month': 0,
		'up_Volume_quarter': 0,
		'up_Volume_year': 0,
		'up_Awarded_day': 0,
		'up_Awarded_week': 0,
		'up_Awarded_month': 0,
		'up_Awarded_quarter': 0,
		'up_Awarded_year': 0,
		'up_VolumeAwarded': 0,
		'up_Auction': 0,
		'up_Sertificate': 0,

		'down_Volume_day': 0,
		'down_Volume_week': 0,
		'down_Volume_month': 0,
		'down_Volume_quarter': 0,
		'down_Volume_year': 0,
		'down_Awarded_day': 0,
		'down_Awarded_week': 0,
		'down_Awarded_month': 0,
		'down_Awarded_quarter': 0,
		'down_Awarded_year': 0,
		'down_VolumeAwarded': 0,
		'down_Auction': 0,
		'down_Sertificate': 0,

		'both_Volume_day': 0,
		'both_Volume_week': 0,
		'both_Volume_month': 0,
		'both_Volume_quarter': 0,
		'both_Volume_year': 0,
		'both_Awarded_day': 0,
		'both_Awarded_week': 0,
		'both_Awarded_month': 0,
		'both_Awarded_quarter': 0,
		'both_Awarded_year': 0,
		'both_VolumeAwarded': 0,
		'both_Auction': 0,
		'both_Sertificate': 0,
		'range_Sertificate': 0
	};
	arAnalysis.splice(0, arAnalysis.length); strAnalysis = "[";

	var tblAnalysis = outputAnalysis("Head", {}, ""), color = "#999";
	var a = 0, chSertificate = getSertificate(chJSON.Sertificate[0]);
	var chDate, chTime, chProduct, chDirection, chID, chPeriod;

	//! Визначити причину різної довжини вихідного масиву

	var valDirection, arStructure = {}, Sertificate, up, down, both;
	for (var TPP in chAnalysis) {
		chDate = chAnalysis[TPP];
		for (var Date in chDate) {
			chTime = chDate[Date];
			for (var Time in chTime) {
				chProduct = chTime[Time];
				for (var Product in chProduct) {
					chDirection = chProduct[Product];
					arStructure = chStructure; //arStructure.splice(0, arStructure.length);
					arStructure.Date = Date;
					arStructure.Time = (parseInt(Time) - 1) + ":00";
					arStructure.TPP = TPP;
					arStructure.Product = Product;

					for (var Direction in chDirection) {
						valDirection = 0;
						chID = chDirection[Direction];
						for (var ID in chID) {				// {Volume:{ }, Awarded:{ } }
							chPeriod = chID[ID];
							for (var Period in chPeriod) { //  { 'day': 0, 'week': 0, 'month': 0 };
								valDirection = valDirection + chPeriod[Period];
								arStructure[Direction + "_" + ID + "_" + Period] = chPeriod[Period];
							}
						}
						arStructure[Direction + "_VolumeAwarded"] = valDirection;
					}
					arStructure.up_Sertificate = chSertificate[TPP + "_" + Product + "_up"];
					arStructure.down_Sertificate = chSertificate[TPP + "_" + Product + "_down"];
					arStructure.both_Sertificate = chSertificate[TPP + "_" + Product + "_both"];
					arStructure.range_Sertificate = chSertificate[TPP + "_" + Product + "_range"];

					up = arStructure.up_VolumeAwarded;
					down = arStructure.down_VolumeAwarded;
					both = arStructure.both_VolumeAwarded;

					if (Product == "FCR") {
						arStructure.both_Auction = 2 * both; arStructure.Direction = 'range';
					}
					if (Product == "aFRR") {
						if (up > 0 && down == 0) { arStructure.up_Auction = up + both; arStructure.Direction = 'up'; }
						if (down > 0 && up == 0) { arStructure.down_Auction = down + both; arStructure.Direction = 'down'; }
						if (both > 0 || (up > 0 && down > 0)) { arStructure.both_Auction = down + up + 2 * both; arStructure.Direction = 'both'; }
					}
					if (Product == "mFRR" || Product == "RR") {
						if (up > 0 && down == 0) { arStructure.up_Auction = up; arStructure.Direction = 'up'; }
						if (down > 0 && up == 0) { arStructure.down_Auction = down; arStructure.Direction = 'down'; }
						if (down > 0 && up > 0) { arStructure.both_Auction = up + down; arStructure.Direction = 'range'; }
					}

					arStructure.Sertificate = arStructure[arStructure.Direction + "_Sertificate"];
					arStructure.Auction = arStructure[arStructure.Direction + "_Auction"];
					arStructure.Status = 'OK';
					if (arStructure.Sertificate < arStructure.Auction) arStructure.Status = 'ERROR';

					if (arStructure.Status == "ERROR") {
						if (color == "#aaa") { color = "#ddd"; } else { color = "#aaa"; }
						tblAnalysis = tblAnalysis + outputAnalysis("Data", arStructure, color);
					}
					var ZPT = ","; if (strAnalysis == "[") ZPT = "";
					strAnalysis = strAnalysis + ZPT + JSON.stringify(arStructure);
					a++;
				}
			}
		}
	}

	tblAnalysis = tblAnalysis + "</tbody></table>";
	content__table.innerHTML = tblAnalysis;
	strAnalysis = strAnalysis + "]";
	arAnalysis = JSON.parse(strAnalysis);
	countUpload.innerHTML = a;

}

function outputAnalysis(cmd, chRecords, color) {
	var arStructure = [
		'Date',
		'Time',
		'TPP',
		'Product',
		'Direction',
		'Auction',
		'Sertificate',
		'Status',

		'up_Volume_day',
		'up_Volume_week',
		'up_Volume_month',
		'up_Volume_quarter',
		'up_Volume_year',
		'up_Awarded_day',
		'up_Awarded_week',
		'up_Awarded_month',
		'up_Awarded_quarter',
		'up_Awarded_year',
		'up_VolumeAwarded',
		'up_Auction',
		'up_Sertificate',

		'down_Volume_day',
		'down_Volume_week',
		'down_Volume_month',
		'down_Volume_quarter',
		'down_Volume_year',
		'down_Awarded_day',
		'down_Awarded_week',
		'down_Awarded_month',
		'down_Awarded_quarter',
		'down_Awarded_year',
		'down_VolumeAwarded',
		'down_Auction',
		'down_Sertificate',

		'both_Volume_day',
		'both_Volume_week',
		'both_Volume_month',
		'both_Volume_quarter',
		'both_Volume_year',
		'both_Awarded_day',
		'both_Awarded_week',
		'both_Awarded_month',
		'both_Awarded_quarter',
		'both_Awarded_year',
		'both_VolumeAwarded',
		'both_Auction',
		'both_Sertificate',
		'range_Sertificate'
	];
	var arName = ['Дата', 'Час', 'ПДП', 'ДП', 'Нап', 'Подано', 'Серт', 'Стат', 'д', 'т', 'м', 'к', 'р', 'д', 'т', 'м', 'к', 'р', 'д', 'т', 'м', 'к', 'р', 'д', 'т', 'м', 'к', 'р', 'д', 'т', 'м', 'к', 'р', 'д', 'т', 'м', 'к', 'р'];
	//'д-нь', 'т-нь', 'м-ць', 'к-л', 'рік'
	var arWd = [80, 40, 0, 50, 35, 45, 45, 65, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 35, 35, 35, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 35, 35, 35, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 35, 35, 35, 35];

	var tblAnalysis = "";

	if (cmd == "Head") {
		tblAnalysis = "<table width='100%' class='content__table_data'><thead>";
		tblAnalysis = tblAnalysis + "<tr >";
		for (var i = 0; i < 8; i++) { tblAnalysis = tblAnalysis + "<th rowspan=3>" + arName[i] + "</th>"; }
		tblAnalysis = tblAnalysis + "<th colspan=13>UP</th><th colspan=13>DOWN</th><th colspan=14>BOTH</th></tr>";

		tblAnalysis = tblAnalysis + "<tr ><th colspan=5>Volume</th><th colspan=5>Awarded</th><th rowspan=2>Сум</th><th rowspan=2>З-но</th><th rowspan=2>С-т</th><th colspan=5>Volume</th><th colspan=5>Awarded</th><th rowspan=2>Сум</th><th rowspan=2>З-но</th><th rowspan=2>С-т</th><th colspan=5>Volume</th><th colspan=5>Awarded</th><th rowspan=2>Сум</th><th rowspan=2>З-но</th><th rowspan=2>С-т</th><th rowspan=2>С-т</th></tr>";
		tblAnalysis = tblAnalysis + "<tr >";
		for (var i = 8; i < arName.length; i++) { tblAnalysis = tblAnalysis + "<th>" + arName[i] + "</th>"; }
		tblAnalysis = tblAnalysis + "</tr></thead><tbody>";
	}
	else {
		tblAnalysis = tblAnalysis + "<tr>"; //style='background-color: " + color + "'
		for (var i = 0; i < arStructure.length; i++) {
			var Twidth = "width:" + arWd[i] + "px"; if (arWd[i] == 0) Twidth = ""
			tblAnalysis = tblAnalysis + "<td style='" + Twidth + "'>" + chRecords[arStructure[i]] + "</td>";
		}
		tblAnalysis = tblAnalysis + "</tr>";
	}
	return tblAnalysis;

}

function downloadAsExcel() {
	var arD = arAnalysis[0].Date.split("-"), sM = "010203040506070809101112";
	var Y = arD[0], m = (parseInt(arD[1]) - 1) * 2, M = sM[m] + sM[m + 1], flDate = Y + "-" + M;
	const worksheet = XLSX.utils.json_to_sheet(arAnalysis);

	const workbook = {
		Sheets: { 'data': worksheet },
		SheetNames: ['data']
	};
	const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
	console.log(excelBuffer);
	saveAsExcel(excelBuffer, 'resAuction_' + flDate);

	arAnalysis.splice(0, arAnalysis.length);
	menu_upload.classList.remove('menu__element_upload-on');
	menu_uploadauction.classList.remove('menu__element_upload-on');
	countUpload.innerHTML = 0;
	countUploadAuction.innerHTML = 0;
}

function saveAsExcel(buffer, filename) {
	const data = new Blob([buffer], { type: EXCEL_TYPE });
	saveAs(data, filename + "_" + new Date().getTime() + EXCEL_EXTENSION);
}

function downloadAsExcelAuction() {
	var chData = [], a = 0, sM = "010203040506070809101112";
	var DT = getPeriod(chName.Awarded[0]).Date1, Y = DT.getFullYear(), m = DT.getMonth() * 2, M = sM[m] + sM[m + 1];
	var fDate = Y + "-" + M;
	//chName[idUpload][iName]
	for (var ID in chJSON) {
		var chID = chJSON[ID];
		if (ID != "Sertificate") {
			for (var ifile in chID) {
				var chArray = chID[ifile];
				var fileName = chName[ID][parseInt(ifile)];
				for (var i = 0; i < chArray.length; i++) {
					chData[a] = {};
					chData[a] = chArray[i];
					chData[a]["NameFile"] = fileName;
					a++;
				}
			}
		}
	}

	const worksheet = XLSX.utils.json_to_sheet(chData);
	const workbook = {
		Sheets: { 'data': worksheet },
		SheetNames: ['data']
	};
	const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
	console.log(excelBuffer);
	saveAsExcel(excelBuffer, 'allAuction_' + fDate);
}



UploadFile("Awarded");
UploadFile("Volume");
UploadFile("Sertificate");

//function onchangeUpload(idUpload) {
//	var allFile, Name, iName;
//	document
//		.getElementById("file" + idUpload)
//		.addEventListener("change", function () {
//			iName = 0; content__table.innerHTML = idUpload + "<br>"; chName[idUpload] = []; chJSON[idUpload] = [];
//			allFile = event.target.files;
//			for (var i = 0; i < allFile.length; i++) {
//				chJSON[idUpload][i] = {}; chName[idUpload][i] = allFile[i].name;
//				var fileReader = new FileReader();
//				fileReader.onload = function (event) {
//					var data = event.target.result;
//					var workbook = XLSX.read(data, { type: 'binary' });
//					workbook.SheetNames.forEach(sheet => {
//						Name = chName[idUpload][iName];
//						chJSON[idUpload][iName] = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheet]);
//						content__table.innerHTML = content__table.innerHTML + (iName + 1) + ". " + Name + " - " + chJSON[idUpload][iName].length + "<br>";
//						iName++;
//					});
//				};
//				fileReader.readAsBinaryString(allFile[i]);
//			}
//		});
//}