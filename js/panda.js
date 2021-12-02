// БЛОК 0
// Ініціація Задачі
var chPanda = { 						// глобальна змінна Задачі
	'idUpload': '', 					// тип даних: awarded, volume, sertificate  
	'iName': 0, 'NName': 0,			// завтажені файли: лічильник, кількість 
	'chJSON': {							// Хеш даних:
		'awarded': [], 					// - акцептованих порпозицій
		'volume': [], 					// - поданих порпозицій
		'sertificate': []				// - сертифікатів
	},
	'chName': {							// Назви файлів
		'awarded': [], 				// - акцептованих порпозицій
		'volume': [], 					// - поданих порпозицій
		'sertificate': []				// - сертифікатів
	},
	'shSize': { 						// Кількість записів по: 
		'awarded': 0, 					// - акцептованим порпозиціям
		'volume': 0, 					// - поданим порпозиціям
		'sertificate': 0 				// - сертифікатам
	},
	'arСonsolidat': [],				// Дані аукціонів - Консолідовані
	'chSort': {},						// Дані аукціонів - Розсортовані
	'arAnalysis': [],					// Дані аукціонів - Проаналізовані
	'chErrTPP': {},					// Хеш - ПДП з завищеними пропозиціями
	'arErrAuction': [],				// Хеш - Завищених пропозицій
	'tblAnalysis': ''					// Таблиця з завищеними пропозиціями
};
let elem = document.documentElement.childNodes;	// БЛОК 2
let items = document.querySelectorAll('.paralax__basket, .paralax__list-stick');// БЛОК 2

//********************************************************************************
// БЛОК 1
// Паралакс
$(document).ready(function () {
	$('.paralax__list>li').addClass('layer');
	$('.paralax__list').parallax();
});


//********************************************************************************
// БЛОК 2
// Інтерфейс - завнтаження drag and drop
// html, body - не реагувати на пертягування та скидання файлів
function handleDragOverDropBody(event) { event.preventDefault(); event.stopPropagation(); return false; }
for (let i = 0; i < elem.length; i++) { // перебір елементів ТІЛЬКИ за допомогою for
	elem[i].addEventListener('dragover', handleDragOverDropBody);	//elem[i].ondragover = handleDragOverDropBody;
	elem[i].addEventListener('drop', handleDragOverDropBody);		//elem[i].ondrop = handleDragOverDropBody;
}

// div - отримання скинутих файлів
function handleDragOver() { this.classList.add('over'); return false; }
function handleDragLeave() { this.classList.remove('over'); return false; }
function handleDrop(event) {
	this.classList.remove('over'); event.preventDefault();
	chPanda.idUpload = this.id;
	let files = event.dataTransfer.files;
	Upload(files);
}
items.forEach(function (item) {
	item.addEventListener('dragover', handleDragOver);					//item.ondragover = handleDragOver;
	item.addEventListener('dragleave', handleDragLeave);				//item.ondragleave = handleDragLeave;
	item.addEventListener('drop', handleDrop);							//item.ondrop = handleDrop;
});
//Прогрес завантаження файлів: показати/приховати		
function ShowProgress(Percent) {
	sun_progress.style.height = (Percent * 1.44) + "px";
	sun_percent.style.color = "#fff"; sun_percent.innerHTML = Percent + "%";
	if (Percent >= 100) setTimeout(HideProgress, 1000);
}
function HideProgress() {
	sun_percent.style.color = "#fe9e02";
	let objUpload = document.getElementById(chPanda.idUpload);
	objUpload.classList.add('upload');
}

// Читаємо дані з EXCEL та зберігаємо у хеш chPanda.chName-назви файлів та chPanda.chJSON-дані
function readFile(file) {
	let fr = new FileReader();													// EXCEL - порожній обєкт файлу
	var fileName = file.name;													// EXCEL - назва файлу
	fr.onload = function () {
		let idU = chPanda.idUpload, iN = chPanda.iName;
		let uCount = document.getElementById(idU + "_count");			// Підключаємося до лічильника
		chPanda.chJSON[idU][iN] = {};											// ХЕШ ДАНИХ - Створюємо порожній ХЕШ
		let data = fr.result;													// EXCEL - присвоєння обєкту завантаженого файлу
		let workbook = XLSX.read(data, { type: 'binary' });			// EXCEL - читаємо вкладки
		workbook.SheetNames.forEach(sheet => {								// EXCEL - перебір вкладок 
			chPanda.chName[idU][iN] = fileName;								// МАСИВ НАЗВ ФАЙЛІВ
			chPanda.chJSON[idU][iN] = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheet]); // ХЕШ ДАНИХ - Записуємо нові дані
			chPanda.shSize[idU] = chPanda.shSize[idU] + parseInt(chPanda.chJSON[idU][iN].length);   // Кількість записів
			uCount.innerHTML = chPanda.shSize[idU];							// Показуємо загальну кількість записів
		});
		chPanda.iName++;
		let Percent = Math.round((chPanda.iName / chPanda.NName) * 100);	// Процент завантаження файлів
		ShowProgress(Percent);															// Прогрес завантаження файлів		
		if ((chPanda.shSize.awarded > 0 || chPanda.shSize.volume > 0) && chPanda.shSize.sertificate > 0) {
			setDefaltStyle(0, 0); //Завантаження пропозицій - встановлення значень та стилів 
		}
	};
	fr.readAsBinaryString(file);
}

//Завантаження на сервер та перебір отриманих файлів
function Upload(files) {
	let idU = chPanda.idUpload;
	chPanda.iName = 0; chPanda.NName = files.length;
	chPanda.chJSON[idU] = []; chPanda.chName[idU] = []; chPanda.shSize[idU] = 0;
	for (let i = 0; i < chPanda.NName; i++) {
		readFile(files[i]); console.log(files[i].name);
	}
	setDefaltStyle(1, 0); //Завантаження пропозицій - встановлення значень та стилів 
}

//********************************************************************************
// БЛОК 3

// Дата - Отримання дати з назви файлу
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
// Дані Сертіфікатів - Отримання даних Сертіфікатів ПДП
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
// Дані по Назві Продукту
function getProduct(ProductAlias) {
	var P, D, T, arP = ProductAlias.split("_"), p = arP[0], d = arP[1], t = arP[2];
	var aD = { 'з': 'up', 'р': 'down', 'с': 'both' }, aP = { 'РПЧ': 'FCR', 'аРВЧ': 'aFRR', 'рРВЧ': 'mFRR', 'РЗ': 'RR' };
	P = aP[p]; D = aD[d]; T = parseInt(t) - 1;
	var arProduct = { 'Product': P, 'Direction': D, 'Time': T };
	return arProduct;
}
// Дата - отримання дати Пропозиції для кожного запису
function getDateStr(Date1) {
	var Y, M, D, strDate; Y = Date1.getFullYear(); M = parseInt(Date1.getMonth()) + 1; D = Date1.getDate();
	strDate = Y + "-" + M + "-" + D;
	return strDate;
}

// Дані - Консолідація 
function consolidateData() {
	let ia = 0, ip = 0;
	if (chPanda.shSize.awarded > 0 && chPanda.shSize.sertificate > 0) {
		chPanda.chSort = {}; chPanda.arСonsolidat = [];						 		//Масиви: Консолідовані, Розсортовані - онулення
		let arSertificate = getSertificate(chPanda.chJSON.sertificate[0]);	//Дані Сертифікатів
		for (let idU in chPanda.chName) {												//Прохід по всім Пропозиціям
			if (idU != "sertificate") {
				for (let iN = 0; iN < chPanda.chName[idU].length; iN++) {		//Прохід по всім Файлам Пропозицій
					for (let j = 0; j < chPanda.chJSON[idU][iN].length; j++) {	//Прохід по всім Записам Пропозицій 

						let arPeriod = getPeriod(chPanda.chName[idU][iN]),			// Дата - Отримання дати з назви файлу	
							Date1 = arPeriod.Date1, Date2 = arPeriod.Date2, Period = arPeriod.Period;
						let chJ = chPanda.chJSON[idU][iN][j],
							TPP = chJ.BalanceGroupAlias,
							arProduct = getProduct(chJ.ProductAlias), Product = arProduct.Product,
							Direction = arProduct.Direction, Time = arProduct.Time,
							Awarded = parseInt(chJ.AwardedAmount);

						let keySertificate = TPP + "_" + Product, up_sertificate = arSertificate[keySertificate + "_up"], down_sertificate = arSertificate[keySertificate + "_down"],
							both_sertificate = arSertificate[keySertificate + "_both"], range_sertificate = arSertificate[keySertificate + "_range"];

						chPanda.arСonsolidat[ia] = chJ;
						chPanda.arСonsolidat[ia]["FileName"] = chPanda.chName[idU][iN];
						chPanda.arСonsolidat[ia]["SertificateUp"] = up_sertificate;
						chPanda.arСonsolidat[ia]["SertificateDown"] = down_sertificate;
						chPanda.arСonsolidat[ia]["SertificateBoth"] = both_sertificate;
						chPanda.arСonsolidat[ia]["SertificateRange"] = range_sertificate;
						chPanda.arСonsolidat[ia]["Date"] = getDateStr(Date1);

						while (Date1 <= Date2) {
							let DateAuction = getDateStr(Date1);
							let keyTPP = TPP + "_" + DateAuction + "_" + Time + "_" + Product,
								keyDirection = Direction + "_" + idU + "_" + Period,
								keySum = Direction + "_awardedvolume";

							if (!chPanda.chSort[keyTPP]) {
								chPanda.chSort[keyTPP] = {
									'Date': '-', 'Time': '-', 'TPP': '-', 'Product': '-', 'Direction': '-', 'Auction': '-', 'Sertificate': '-', 'Status': '-',
									'up_awarded_day': 0, 'up_awarded_week': 0, 'up_awarded_month': 0, 'up_awarded_quarter': 0, 'up_awarded_year': 0, 'up_volume_day': 0, 'up_volume_week': 0, 'up_volume_month': 0, 'up_volume_quarter': 0, 'up_volume_year': 0, 'up_awardedvolume': 0, 'up_auction': 0, 'up_sertificate': up_sertificate,
									'down_awarded_day': 0, 'down_awarded_week': 0, 'down_awarded_month': 0, 'down_awarded_quarter': 0, 'down_awarded_year': 0, 'down_volume_day': 0, 'down_volume_week': 0, 'down_volume_month': 0, 'down_volume_quarter': 0, 'down_volume_year': 0, 'down_awardedvolume': 0, 'down_auction': 0, 'down_sertificate': down_sertificate,
									'both_awarded_day': 0, 'both_awarded_week': 0, 'both_awarded_month': 0, 'both_awarded_quarter': 0, 'both_awarded_year': 0, 'both_volume_day': 0, 'both_volume_week': 0, 'both_volume_month': 0, 'both_volume_quarter': 0, 'both_volume_year': 0, 'both_awardedvolume': 0, 'both_auction': 0, 'both_sertificate': both_sertificate, 'range_sertificate': range_sertificate
								};
								ip++;
							}
							chPanda.chSort[keyTPP][keySum] += Awarded;
							chPanda.chSort[keyTPP][keyDirection] += Awarded;
							Date1.setDate(Date1.getDate() + 1);
						}
						ia++;
					}
				}
			}
		}
		//Запуск обробки даних
		let iErr = analysisData(); //первіряємо дані аукціонів та отримуємо кількість завищених пропозицій

		setDefaltStyle(2, iErr); //Перевірки пропозицій - Встановлення значень та стилів після 
	}
}

// Дані - Аналіз
function analysisData() {
	let ip = 0, iErr = 0, setDirection = "";
	chPanda.arAnalysis = [];		// Дані аукціонів - Проаналізовані
	chPanda.chErrTPP = {}; 					// Хеш - ПДП з завищеними пропозиціями
	chPanda.arErrAuction = [];				// Хеш - Завищених пропозицій 
	chPanda.tblAnalysis = "";
	for (let keyTPP in chPanda.chSort) {
		let aKey = keyTPP.split("_"), TPP = aKey[0], DateAuction = aKey[1], TimeAuction = aKey[2] + ":00", Product = aKey[3];
		chPanda.arAnalysis[ip] = chPanda.chSort[keyTPP];
		chPanda.arAnalysis[ip].Date = DateAuction
		chPanda.arAnalysis[ip].Time = TimeAuction
		chPanda.arAnalysis[ip].TPP = TPP;
		chPanda.arAnalysis[ip].Product = Product

		let up = chPanda.arAnalysis[ip].up_awardedvolume, down = chPanda.arAnalysis[ip].down_awardedvolume, both = chPanda.arAnalysis[ip].both_awardedvolume;

		if (Product == "FCR") {
			chPanda.arAnalysis[ip].both_auction = both; chPanda.arAnalysis[ip].Direction = 'range'; setDirection = "both";
		}
		if (Product == "aFRR") {
			if ((up > 0 && down == 0 && both == 0) || (up > 0 && down == 0 && both > 0)) {
				chPanda.arAnalysis[ip].up_auction = up + both; chPanda.arAnalysis[ip].Direction = 'up'; setDirection = "up";
			}
			if ((up == 0 && down > 0 && both == 0) || (up == 0 && down > 0 && both > 0)) {
				chPanda.arAnalysis[ip].down_auction = down + both; chPanda.arAnalysis[ip].Direction = 'down'; setDirection = "down";
			}
			if ((up == 0 && down == 0 && both > 0) || (up > 0 && down > 0 && both == 0) || (up > 0 && down > 0 && both > 0)) {
				chPanda.arAnalysis[ip].both_auction = down + up + 2 * both; chPanda.arAnalysis[ip].Direction = 'both'; setDirection = "both";
			}
		}
		if (Product == "mFRR" || Product == "RR") {
			if (up > 0 && down == 0) { chPanda.arAnalysis[ip].up_auction = up; chPanda.arAnalysis[ip].Direction = 'up'; setDirection = "up"; }
			if (up == 0 && down > 0) { chPanda.arAnalysis[ip].down_auction = down; chPanda.arAnalysis[ip].Direction = 'down'; setDirection = "down"; }
		}

		chPanda.arAnalysis[ip].Sertificate = chPanda.arAnalysis[ip][setDirection + "_sertificate"];
		chPanda.arAnalysis[ip].Auction = chPanda.arAnalysis[ip][setDirection + "_auction"];
		chPanda.arAnalysis[ip].Status = 'OK';
		if (chPanda.arAnalysis[ip].Sertificate < chPanda.arAnalysis[ip].Auction) {
			chPanda.arAnalysis[ip].Status = 'ERROR';
			chPanda.tblAnalysis += setErrTR(chPanda.arAnalysis[ip]);
			if (!chPanda.chErrTPP[TPP]) { chPanda.chErrTPP[TPP] = 1; };
			chPanda.arErrAuction[iErr] = chPanda.arAnalysis[ip];
			iErr++;
		}
		ip++;
	}
	return iErr; //повертає кількість завищених пропозицій
}

//********************************************************************************
//БЛОК - 4 Вивід/завантаження даних

// Стилі за замовчуванням
function setDefaltStyle(Choise, Parametr) {
	//Первірки пропозицій - Встановлення значень та стилів після 
	if (Choise == 0) {
		panda.classList.add('over');												//Включаємо підсвітку
		panda_img.src = "img/panda_bol_on.png";
	}
	//Завантаження пропозицій - встановлення значень та стилів 
	if (Choise == 1) {
		let asrc = basket.src.split("/"), n = asrc.length - 1, img = asrc[n];
		if (img == "basket_full.png") {
			sertificate.classList.remove('over'); sertificate.classList.remove('analis');
			sertificate_count.innerHTML = Parametr; sertificate_plate.innerHTML = "Сертифікати";
			sertificate.classList.remove('analis');
			basket.src = "img/basket.png";
			bober.classList.remove('over');			//Вивантаження консолідованих аукціонів
			chPanda.arСonsolidat = [];					//Скидаємо консолідовані данні аукціонів
		}
	}
	//Скидання після аналізу поданих пропозицій
	if (Choise == 2) {
		chPanda.chJSON = {}; chPanda.chName = {};
		chPanda.shSize.awarded = 0; awarded.classList.remove('upload'); awarded_count.innerHTML = 0;
		chPanda.shSize.volume = 0; volume.classList.remove('upload'); volume_count.innerHTML = 0;
		chPanda.shSize.sertificate = 0; sertificate.classList.remove('upload');
		sertificate_count.innerHTML = Parametr;
		sertificate_plate.innerHTML = "Перевищення";
		panda.classList.remove('over'); // Панда не обробляє пропозиції - виключаємо підсвітку
		sertificate.classList.remove('over');
		sertificate.classList.add('analis');
		basket.src = "img/basket_full.png";
		panda_img.src = "img/panda_bol.png";

		bober.classList.add('over');				//Вивантаження консолідованих аукціонів
	}
}

// Формування - одного запусу у таблиці ПДП що зависили пропозиції
function setErrTR(chTR) {
	let arKey = ['Date', 'Time', 'TPP', 'Product', 'Direction', 'Auction', 'Sertificate', 'Status',
		'up_auction', 'up_sertificate', 'down_auction', 'down_sertificate', 'both_auction', 'both_sertificate'];
	let stTR = "<tr>";
	for (var i = 0; i < arKey.length; i++) { let Key = arKey[i]; stTR += "<td>" + chTR[Key] + "</td>"; }
	stTR += "</tr>";
	return stTR;
}
//Формування однієї стрічки таблиці завищених пропозицій ПДП
function btnErrTpp() {
	let btnErrTPP = "", active;
	for (let TPP in chPanda.chErrTPP) {
		active = "active";
		if (chPanda.chErrTPP[TPP] == 1) active = "";
		btnErrTPP += "<div class='tpp__station'><div class='tpp__station_box " + active + "' id='tpp__station_" + TPP + "' onclick='setErrTPP(this)'>" + TPP + "</div></div>";
	}
	return btnErrTPP;
}
//Вивід завищених пропозицій по обраним ПДП
function setErrTPP(e) {
	let TPP = e.id.split("_")[3]; chPanda.tblAnalysis = "";
	if (chPanda.chErrTPP[TPP] == 0) { chPanda.chErrTPP[TPP] = 1; } else { chPanda.chErrTPP[TPP] = 0; }
	e.classList.toggle('active');
	for (let ir = 0; ir < chPanda.arErrAuction.length; ir++) {
		TPP = chPanda.arErrAuction[ir].TPP;
		if (chPanda.chErrTPP[TPP] == 1) { chPanda.tblAnalysis += setErrTR(chPanda.arErrAuction[ir]); }
	}
	table.innerHTML = chPanda.tblAnalysis;
}
//Аркуш з проаналізованими пропозиціями - Показати
function showPaper() {
	if (chPanda.arErrAuction.length > 0) {
		paper.style.display = "block";
		tpp.innerHTML = btnErrTpp(); //show TPP
		table.innerHTML = chPanda.tblAnalysis; //Show err proposition
	}
}
//Аркуш з проаналізованими пропозиціями - Скрити
function closePage() { paper.style.display = "none"; }

//********************************************************************************
//БЛОК - 5 Заватаження Excel

//Excel з проаналізованими пропозиціями ПДП
function downloadExcelAnalysis() {
	var arD = chPanda.arAnalysis[0].Date.split("-"), sM = "010203040506070809101112";
	var Y = arD[0], m = (parseInt(arD[1]) - 1) * 2, M = sM[m] + sM[m + 1], flDate = Y + "-" + M;
	const worksheet = XLSX.utils.json_to_sheet(chPanda.arAnalysis);

	const workbook = {
		Sheets: { 'data': worksheet },
		SheetNames: ['data']
	};
	const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
	console.log(excelBuffer);
	saveAsExcel(excelBuffer, 'resAuction_' + flDate);
}
//Excel з пропозиціями ПДП
function downloadExcelAuction() {
	if (chPanda.arСonsolidat.length > 0) {
		var arD = chPanda.arСonsolidat[0].Date.split("-"), sM = "010203040506070809101112";
		var Y = arD[0], m = (parseInt(arD[1]) - 1) * 2, M = sM[m] + sM[m + 1], flDate = Y + "-" + M;

		const worksheet = XLSX.utils.json_to_sheet(chPanda.arСonsolidat);
		const workbook = {
			Sheets: { 'data': worksheet },
			SheetNames: ['data']
		};
		const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
		console.log(excelBuffer);
		saveAsExcel(excelBuffer, 'allAuction_' + flDate);
	}
}

function saveAsExcel(buffer, filename) {
	const EXCEL_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
	const EXCEL_EXTENSION = ".xlsx";
	const data = new Blob([buffer], { type: EXCEL_TYPE });
	saveAs(data, filename + "_" + new Date().getTime() + EXCEL_EXTENSION);
}