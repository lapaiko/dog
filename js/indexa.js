var chJSON = {}, chName = {}, shSize = { 'awarded': 0, 'volume': 0, 'sertificate': 0 };
var chAnalysis = {}, arAnalysis = [], arAuction = [];
var chErrTPP = {}; arErrAuction = [];

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
	var arD = nameFile.split("_"), intDay = 86400000, iDate = 0;
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
	P = aP[p]; D = aD[d]; T = parseInt(t) - 1;
	var arProduct = { 'Product': P, 'Direction': D, 'Time': T };
	return arProduct;
}

function UploadFile(idInput) {
	var idForm = "menu__upload_" + idInput, idFile = "file_" + idInput, idUpload, allFile, iName;
	var uForm = document.getElementById(idForm), uFile = document.getElementById(idFile);
	var pbIndicator = document.getElementById("progressbar__indicator"),
		pbPercent = document.getElementById("progressbar__percent"),
		pbBody = document.getElementById("progressbar__body");

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
		allFile = this.files; idUpload = this.id.split("_")[1];
		uploadAuction();
	});

	function closeMessage() {
		pbBody.style.visibility = "hidden";
		pbPercent.innerHTML = ""; pbIndicator.style.width = "0%";
	}	//Закрываем сообщение message message_hidden
	function showMessage(data) {
		if (data < 100) {
			pbBody.style.visibility = "visible";
			pbPercent.innerHTML = data + " %"; pbIndicator.style.width = data + "%";
		} else {
			pbBody.style.visibility = "visible";
			pbPercent.innerHTML = "100 %"; pbIndicator.style.width = "100%";
			setTimeout(closeMessage, 1000);
		}
	}

	function readFile(file) {
		let fr = new FileReader();
		var fileName = file.name;
		fr.onload = function () {
			let uCount = document.getElementById("count_" + idUpload);
			let data = fr.result;
			let workbook = XLSX.read(data, { type: 'binary' });
			chJSON[idUpload][iName] = {};
			workbook.SheetNames.forEach(sheet => {
				chName[idUpload][iName] = fileName;
				chJSON[idUpload][iName] = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheet]);

				let Percent = Math.round(((iName + 1) / allFile.length) * 100);
				showMessage(Percent);

				shSize[idUpload] = shSize[idUpload] + parseInt(chJSON[idUpload][iName].length);
				uCount.innerHTML = shSize[idUpload]; count_auction.innerHTML = parseInt(count_awarded.innerHTML) + parseInt(count_volume.innerHTML);
				iName++;
			});
			if (shSize.awarded > 0 && shSize.sertificate > 0) {
				menu__upload_concolidate.classList.add('menu__upload_concolidate-on');
			}
			if (shSize.awarded > 0) {
				menu__upload_auction.classList.add('menu__upload_auction-on');
			}
		};
		fr.readAsBinaryString(file);
	}

	function uploadAuction() {
		iName = 0; chJSON[idUpload] = []; chName[idUpload] = [];
		for (let i = 0; i < allFile.length; i++) {
			readFile(allFile[i]);
		}
	}
}

//consolidation		
function consolidateData() {
	let ia = 0, ip = 0;
	if (shSize.awarded > 0 && shSize.sertificate > 0) {
		chAnalysis = {}; arAuction = [];
		let arSertificate = getSertificate(chJSON["sertificate"][0]);
		for (let ID in chName) {
			if (ID != "sertificate") {
				for (let i = 0; i < chName[ID].length; i++) {
					for (let j = 0; j < chJSON[ID][i].length; j++) {

						let arPeriod = getPeriod(chName[ID][i]),
							Date1 = arPeriod.Date1, Date2 = arPeriod.Date2, Period = arPeriod.Period;
						let chJ = chJSON[ID][i][j],
							TPP = chJ.BalanceGroupAlias,
							arProduct = getProduct(chJ.ProductAlias), Product = arProduct.Product,
							Direction = arProduct.Direction, Time = arProduct.Time,
							Awarded = parseInt(chJ.AwardedAmount);

						let keySertificate = TPP + "_" + Product, up_sertificate = arSertificate[keySertificate + "_up"], down_sertificate = arSertificate[keySertificate + "_down"],
							both_sertificate = arSertificate[keySertificate + "_both"], range_sertificate = arSertificate[keySertificate + "_range"];

						arAuction[ia] = chJ;
						arAuction[ia]["FileName"] = chName[ID][i];
						arAuction[ia]["SertificateUp"] = up_sertificate;
						arAuction[ia]["SertificateDown"] = down_sertificate;
						arAuction[ia]["SertificateBoth"] = both_sertificate;
						arAuction[ia]["SertificateRange"] = range_sertificate;
						arAuction[ia]["Date"] = getDateStr(Date1);

						while (Date1 <= Date2) {
							let DateAuction = getDateStr(Date1);
							let keyTPP = TPP + "_" + DateAuction + "_" + Time + "_" + Product,
								keyDirection = Direction + "_" + ID + "_" + Period,
								keySum = Direction + "_awardedvolume";

							if (!chAnalysis[keyTPP]) {
								chAnalysis[keyTPP] = {
									'Date': '-', 'Time': '-', 'TPP': '-', 'Product': '-', 'Direction': '-', 'Auction': '-', 'Sertificate': '-', 'Status': '-',
									'up_awarded_day': 0, 'up_awarded_week': 0, 'up_awarded_month': 0, 'up_awarded_quarter': 0, 'up_awarded_year': 0, 'up_volume_day': 0, 'up_volume_week': 0, 'up_volume_month': 0, 'up_volume_quarter': 0, 'up_volume_year': 0, 'up_awardedvolume': 0, 'up_auction': 0, 'up_sertificate': up_sertificate,
									'down_awarded_day': 0, 'down_awarded_week': 0, 'down_awarded_month': 0, 'down_awarded_quarter': 0, 'down_awarded_year': 0, 'down_volume_day': 0, 'down_volume_week': 0, 'down_volume_month': 0, 'down_volume_quarter': 0, 'down_volume_year': 0, 'down_awardedvolume': 0, 'down_auction': 0, 'down_sertificate': down_sertificate,
									'both_awarded_day': 0, 'both_awarded_week': 0, 'both_awarded_month': 0, 'both_awarded_quarter': 0, 'both_awarded_year': 0, 'both_volume_day': 0, 'both_volume_week': 0, 'both_volume_month': 0, 'both_volume_quarter': 0, 'both_volume_year': 0, 'both_awardedvolume': 0, 'both_auction': 0, 'both_sertificate': both_sertificate, 'range_sertificate': range_sertificate
								};
								ip++;
							}
							chAnalysis[keyTPP][keySum] += Awarded;
							chAnalysis[keyTPP][keyDirection] += Awarded;
							Date1.setDate(Date1.getDate() + 1);
						}
						ia++;
					}
				}
			}
		}
		//processing
		processingData();

		menu__upload_concolidate.classList.remove('menu__element_concolidate-on');
		menu__upload_analisys.classList.add('menu__upload_analisys-on');

		chJSON = {}; chName = {};

		file_awarded.Value = ""; file_volume.Value = ""; file_sertificate.Value = "";
		file_awarded.type = ""; file_volume.type = ""; file_sertificate.type = "";
		file_awarded.type = "file"; file_volume.type = "file"; file_sertificate.type = "file";

		shSize.awarded = 0; shSize.volume = 0; shSize.sertificate = 0;
		count_sertificate.innerHTML = 0; count_awarded.innerHTML = 0; count_volume.innerHTML = 0;
		count_concolidate.innerHTML = ia + " > " + ip; count_analisys.innerHTML = ip; count_auction.innerHTML = ia;
	}
}

//processing
function processingData() {
	let ip = 0, ir = 0, setDirection = "";
	arAnalysis = [];
	chErrTPP = {}; arErrAuction = []; tblAnalysis = "";
	for (let keyTPP in chAnalysis) {
		let aKey = keyTPP.split("_"), TPP = aKey[0], DateAuction = aKey[1], TimeAuction = aKey[2] + ":00", Product = aKey[3];
		arAnalysis[ip] = chAnalysis[keyTPP];
		arAnalysis[ip].Date = DateAuction
		arAnalysis[ip].Time = TimeAuction
		arAnalysis[ip].TPP = TPP;
		arAnalysis[ip].Product = Product

		let up = arAnalysis[ip].up_awardedvolume, down = arAnalysis[ip].down_awardedvolume, both = arAnalysis[ip].both_awardedvolume;

		if (Product == "FCR") {
			arAnalysis[ip].both_auction = 2 * both; arAnalysis[ip].Direction = 'range'; setDirection = "both";
		}
		if (Product == "aFRR") {
			if ((up > 0 && down == 0 && both == 0) || (up > 0 && down == 0 && both > 0)) {
				arAnalysis[ip].up_auction = up + both; arAnalysis[ip].Direction = 'up'; setDirection = "up";
			}
			if ((up == 0 && down > 0 && both == 0) || (up == 0 && down > 0 && both > 0)) {
				arAnalysis[ip].down_auction = down + both; arAnalysis[ip].Direction = 'down'; setDirection = "down";
			}
			if ((up == 0 && down == 0 && both > 0) || (up > 0 && down > 0 && both == 0) || (up > 0 && down > 0 && both > 0)) {
				arAnalysis[ip].both_auction = down + up + 2 * both; arAnalysis[ip].Direction = 'both'; setDirection = "both";
			}
		}
		if (Product == "mFRR" || Product == "RR") {
			if (up > 0 && down == 0) { arAnalysis[ip].up_auction = up; arAnalysis[ip].Direction = 'up'; setDirection = "up"; }
			if (up == 0 && down > 0) { arAnalysis[ip].down_auction = down; arAnalysis[ip].Direction = 'down'; setDirection = "down"; }
		}

		arAnalysis[ip].Sertificate = arAnalysis[ip][setDirection + "_sertificate"];
		arAnalysis[ip].Auction = arAnalysis[ip][setDirection + "_auction"];
		arAnalysis[ip].Status = 'OK';
		if (arAnalysis[ip].Sertificate < arAnalysis[ip].Auction) {
			arAnalysis[ip].Status = 'ERROR';
			tblAnalysis += outputAnalysis(arAnalysis[ip]);
			if (!chErrTPP[TPP]) { chErrTPP[TPP] = 1; };
			arErrAuction[ir] = arAnalysis[ip];
			ir++;
		}
		ip++;
	}
	content__element_tpp.style.visibility = "visible";
	content__element_table.style.visibility = "visible";
	tpp__row.innerHTML = outputTpp();
	table__body.innerHTML = tblAnalysis;
}

function outputTpp() {
	let btnTPP = "";
	for (let TPP in chErrTPP) {
		if (chErrTPP[TPP] == 1) {
			btnTPP += "<div class='tpp__station'><div class='tpp__station_box' id='tpp__station_" + TPP + "' onclick='setErrTPP(this)'>" + TPP + "</div></div>";
		}
	}
	return btnTPP;
}

function setErrTPP(e) {
	let TPP = e.id.split("_")[3], tblAnalysis = "";
	if (chErrTPP[TPP] == 0) { chErrTPP[TPP] = 1; } else { chErrTPP[TPP] = 0; }
	e.classList.toggle('active');
	for (let ir = 0; ir < arErrAuction.length; ir++) {
		TPP = arErrAuction[ir].TPP;
		if (chErrTPP[TPP] == 1) { tblAnalysis += outputAnalysis(arErrAuction[ir]); }
	}
	table__body.innerHTML = tblAnalysis;
}

function outputAnalysis(chRecords) {
	let arKey = [
		'Date', 'Time', 'TPP', 'Product', 'Direction', 'Auction', 'Sertificate', 'Status',
		'up_awarded_day', 'up_awarded_week', 'up_awarded_month', 'up_awarded_quarter', 'up_awarded_year', 'up_volume_day', 'up_volume_week', 'up_volume_month', 'up_volume_quarter', 'up_volume_year', 'up_awardedvolume', 'up_auction', 'up_sertificate',
		'down_awarded_day', 'down_awarded_week', 'down_awarded_month', 'down_awarded_quarter', 'down_awarded_year', 'down_volume_day', 'down_volume_week', 'down_volume_month', 'down_volume_quarter', 'down_volume_year', 'down_awardedvolume', 'down_auction', 'down_sertificate',
		'both_awarded_day', 'both_awarded_week', 'both_awarded_month', 'both_awarded_quarter', 'both_awarded_year', 'both_volume_day', 'both_volume_week', 'both_volume_month', 'both_volume_quarter', 'both_volume_year', 'both_awardedvolume', 'both_auction', 'both_sertificate', 'range_sertificate'
	];
	let tdAnalysis = "<tr>";

	for (var i = 0; i < arKey.length; i++) {
		let key = arKey[i];
		tdAnalysis += "<td>" + chRecords[key] + "</td>";
	}
	tdAnalysis += "</tr>";
	return tdAnalysis;
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


	menu__upload_concolidate.classList.remove('menu__upload_concolidate-on');
	menu__upload_analisys.classList.remove('menu__upload_analisys-on');
	menu__upload_auction.classList.remove('menu__upload_auction-on');
	count_concolidate.innerHTML = 0;
	count_analisys.innerHTML = 0;
	count_auction.innerHTML = 0;

	chJSON = {}; chName = {}; shSize.awarded = 0; shSize.volume = 0; shSize.sertificate = 0;
	chAnalysis = {}; arAnalysis = []; arAuction = [];
	chErrTPP = {}; arErrAuction = [];

	content__element_tpp.style.visibility = "hidden";
	content__element_table.style.visibility = "hidden";
	tpp__row.innerHTML = "";
	table__body.innerHTML = "";
}

function downloadAsExcelAuction() {
	var arD = arAuction[0].Date.split("-"), sM = "010203040506070809101112";
	var Y = arD[0], m = (parseInt(arD[1]) - 1) * 2, M = sM[m] + sM[m + 1], flDate = Y + "-" + M;

	const worksheet = XLSX.utils.json_to_sheet(arAuction);
	const workbook = {
		Sheets: { 'data': worksheet },
		SheetNames: ['data']
	};
	const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
	console.log(excelBuffer);
	saveAsExcel(excelBuffer, 'allAuction_' + flDate);
}

function saveAsExcel(buffer, filename) {
	const EXCEL_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
	const EXCEL_EXTENSION = ".xlsx";
	const data = new Blob([buffer], { type: EXCEL_TYPE });
	saveAs(data, filename + "_" + new Date().getTime() + EXCEL_EXTENSION);
}

UploadFile("awarded");
UploadFile("volume");
UploadFile("sertificate");


