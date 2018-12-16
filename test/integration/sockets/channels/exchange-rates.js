'use strict';

var _ = require('underscore');
var async = require('async');
var expect = require('chai').expect;
var express = require('express');

var manager = require('../../../manager');
var app = manager.app;

var channel = 'exchange-rates';

describe('socket.channel: ' + channel, function() {

	var client;
	beforeEach(function(done) {
		client = manager.socketClient();
		client.socket.once('open', function() {
			done();
		});
	});

	afterEach(function() {
		if (client) {
			client.socket.destroy();
			client = null;
		}
	});

	before(function() {
		app.config.exchangeRates.polling.frequency = 10;
		app.config.exchangeRates.polling.retryDelayOnError = 10;
	});

	// A flag that let's us mock when the server goes down and comes back up.
	var mockServersDown;

	before(function(done) {
		var mock = manager.createMockServer(function(error, baseUrl) {
			if (error) return done(error);
			mock.get('/v2/exchange-rates', function(req, res, next) {
				if (mockServersDown) {
					return res.status(500).end();
				}
				res.send('{"data":{"currency":"BTC","rates":{"AED":"23103.39","AFN":"450245.41","ALL":"678313.60","AMD":"3030836.50","ANG":"11400.91","AOA":"1546994.05","ARS":"169721.81","AUD":"8496.57","AWG":"11249.66","AZN":"10677.48","BAM":"10543.91","BBD":"12580.00","BCH":"8.27095654","BDT":"530738.56","BGN":"10525.25","BHD":"2396.490","BIF":"11227650","BMD":"6290.00","BND":"8529.44","BOB":"43401.94","BRL":"23806.78","BSD":"6290.00","BTC":"1.00000000","BTN":"428104.60","BWP":"64890.91","BYN":"12537.89","BYR":"125378947","BZD":"12625.62","CAD":"8375.91","CDF":"10164640.00","CHF":"6214.41","CLF":"146.4941","CLP":"4018366","CNH":"41198.87","CNY":"41136.60","COP":"18449890.90","CRC":"3558441.70","CUC":"6290.00","CVE":"597043.66","CZK":"139692.82","DJF":"1119620","DKK":"40093.52","DOP":"311103.40","DZD":"738040.30","EEK":"91920.12","EGP":"112687.24","ERN":"94560.92","ETB":"173541.10","ETH":"13.48708612","EUR":"5394.68","FJD":"13066.25","FKP":"4740.78","GBP":"4767.02","GEL":"15431.18","GGP":"4740.78","GHS":"29837.24","GIP":"4740.78","GMD":"297265.40","GNF":"56798700","GTQ":"47079.29","GYD":"1311228.72","HKD":"49359.52","HNL":"150551.55","HRK":"39803.64","HTG":"418196.94","HUF":"1755052","IDR":"88575207.89","ILS":"22785.59","IMP":"4740.78","INR":"428506.25","IQD":"7478810.000","ISK":"678958","JEP":"4740.78","JMD":"825640.81","JOD":"4462.774","JPY":"689648","KES":"633660.78","KGS":"428908.82","KHR":"25537400.00","KMF":"2656582","KRW":"7016212","KWD":"1902.360","KYD":"5234.57","KZT":"2132777.45","LAK":"52930350.00","LBP":"9506391.50","LKR":"998663.30","LRD":"924251.52","LSL":"84569.05","LTC":"76.01672368","LTL":"20284.28","LVL":"4127.88","LYD":"8522.950","MAD":"59698.40","MDL":"106846.20","MGA":"20920540.0","MKD":"331290.44","MMK":"8725173.50","MNT":"15352253.93","MOP":"50773.36","MRO":"2239240.0","MTL":"4300.71","MUR":"218839.21","MVR":"96866.79","MWK":"4789614.85","MXN":"126485.35","MYR":"25240.27","MZN":"374887.66","NAD":"84506.15","NGN":"2264400.00","NIO":"199455.90","NOK":"51093.70","NPR":"684912.85","NZD":"9129.95","OMR":"2421.455","PAB":"6290.00","PEN":"20596.61","PGK":"20621.76","PHP":"336172.20","PKR":"764333.17","PLN":"23359.54","PYG":"35785697","QAR":"22902.41","RON":"25124.15","RSD":"635337.18","RUB":"395803.91","RWF":"5487113","SAR":"23584.84","SBD":"49544.24","SCR":"85166.29","SEK":"55828.08","SGD":"8575.02","SHP":"4740.78","SLL":"39658663.72","SOS":"3654490.00","SRD":"46973.72","SSP":"819356.79","STD":"132146866.26","SVC":"54966.89","SZL":"84569.05","THB":"207415.90","TJS":"57398.46","TMT":"22077.65","TND":"16457.068","TOP":"14433.27","TRY":"29548.66","TTD":"42333.90","TWD":"191211.86","TZS":"14322959.00","UAH":"164354.56","UGX":"24309278","USD":"6290.00","UYU":"198004.38","UZS":"49634390.00","VEF":"502571000.00","VND":"143873497","VUV":"681179","WST":"16238.41","XAF":"3529374","XAG":"385","XAU":"5","XCD":"16999.04","XDR":"4458","XOF":"3529374","XPD":"7","XPF":"642064","XPT":"7","YER":"1574072.50","ZAR":"85654.76","ZMK":"33041843.35","ZMW":"61779.04","ZWL":"2027613.02"}}}');
			});
			app.config.coinbase = {
				baseUrl: baseUrl,
			};
			done();
		});
	});

	before(function(done) {
		var mock = manager.createMockServer(function(error, baseUrl) {
			if (error) return done(error);
			mock.get('/public', function(req, res, next) {
				if (mockServersDown) {
					return res.status(500).end();
				}
				res.send('{"BTC_BCN":{"id":7,"last":"0.00000045","lowestAsk":"0.00000046","highestBid":"0.00000045","percentChange":"0.07142857","baseVolume":"50.67125576","quoteVolume":"116182624.12867527","isFrozen":"0","high24hr":"0.00000046","low24hr":"0.00000041"},"BTC_BLK":{"id":10,"last":"0.00002095","lowestAsk":"0.00002129","highestBid":"0.00002099","percentChange":"0.02948402","baseVolume":"1.44138771","quoteVolume":"68884.10206000","isFrozen":"0","high24hr":"0.00002180","low24hr":"0.00002013"},"BTC_BTCD":{"id":12,"last":"0.00795638","lowestAsk":"0.00818483","highestBid":"0.00795639","percentChange":"-0.00880892","baseVolume":"0.02922562","quoteVolume":"3.61382219","isFrozen":"0","high24hr":"0.00818811","low24hr":"0.00795638"},"BTC_BTM":{"id":13,"last":"0.00005212","lowestAsk":"0.00005264","highestBid":"0.00005086","percentChange":"0.03207920","baseVolume":"0.07664122","quoteVolume":"1505.61837226","isFrozen":"0","high24hr":"0.00005253","low24hr":"0.00005050"},"BTC_BTS":{"id":14,"last":"0.00002207","lowestAsk":"0.00002207","highestBid":"0.00002206","percentChange":"0.11183879","baseVolume":"51.21210667","quoteVolume":"2413680.94119887","isFrozen":"0","high24hr":"0.00002223","low24hr":"0.00001985"},"BTC_BURST":{"id":15,"last":"0.00000233","lowestAsk":"0.00000233","highestBid":"0.00000231","percentChange":"0.02192982","baseVolume":"4.35815960","quoteVolume":"1893092.07262365","isFrozen":"0","high24hr":"0.00000236","low24hr":"0.00000222"},"BTC_CLAM":{"id":20,"last":"0.00037406","lowestAsk":"0.00037501","highestBid":"0.00037406","percentChange":"0.03351476","baseVolume":"1.91179633","quoteVolume":"5174.01926908","isFrozen":"0","high24hr":"0.00037495","low24hr":"0.00035845"},"BTC_DASH":{"id":24,"last":"0.03872567","lowestAsk":"0.03884223","highestBid":"0.03872180","percentChange":"-0.00621537","baseVolume":"101.42813661","quoteVolume":"2608.79591326","isFrozen":"0","high24hr":"0.03943207","low24hr":"0.03843333"},"BTC_DGB":{"id":25,"last":"0.00000329","lowestAsk":"0.00000330","highestBid":"0.00000329","percentChange":"0.09302325","baseVolume":"108.40703489","quoteVolume":"33335585.77054718","isFrozen":"0","high24hr":"0.00000344","low24hr":"0.00000299"},"BTC_DOGE":{"id":27,"last":"0.00000041","lowestAsk":"0.00000041","highestBid":"0.00000040","percentChange":"0.05128205","baseVolume":"74.70650010","quoteVolume":"186973422.45400941","isFrozen":"0","high24hr":"0.00000041","low24hr":"0.00000038"},"BTC_EMC2":{"id":28,"last":"0.00001851","lowestAsk":"0.00001851","highestBid":"0.00001835","percentChange":"0.02947719","baseVolume":"9.74562469","quoteVolume":"545547.66294444","isFrozen":"0","high24hr":"0.00001905","low24hr":"0.00001725"},"BTC_FLDC":{"id":31,"last":"0.00000127","lowestAsk":"0.00000130","highestBid":"0.00000127","percentChange":"-0.03053435","baseVolume":"0.45107702","quoteVolume":"349934.85055705","isFrozen":"0","high24hr":"0.00000134","low24hr":"0.00000127"},"BTC_FLO":{"id":32,"last":"0.00000767","lowestAsk":"0.00000774","highestBid":"0.00000767","percentChange":"-0.02417302","baseVolume":"0.49001543","quoteVolume":"63789.36169215","isFrozen":"0","high24hr":"0.00000788","low24hr":"0.00000750"},"BTC_GAME":{"id":38,"last":"0.00010752","lowestAsk":"0.00010752","highestBid":"0.00010646","percentChange":"-0.01484332","baseVolume":"4.49582482","quoteVolume":"42149.44196005","isFrozen":"0","high24hr":"0.00011256","low24hr":"0.00010395"},"BTC_GRC":{"id":40,"last":"0.00000396","lowestAsk":"0.00000396","highestBid":"0.00000395","percentChange":"-0.00251889","baseVolume":"0.44496710","quoteVolume":"112376.63384039","isFrozen":"0","high24hr":"0.00000403","low24hr":"0.00000394"},"BTC_HUC":{"id":43,"last":"0.00000827","lowestAsk":"0.00000827","highestBid":"0.00000796","percentChange":"0.05889884","baseVolume":"0.10423087","quoteVolume":"13172.14376688","isFrozen":"0","high24hr":"0.00000832","low24hr":"0.00000781"},"BTC_LTC":{"id":50,"last":"0.01321461","lowestAsk":"0.01323000","highestBid":"0.01322500","percentChange":"0.03808138","baseVolume":"306.58060376","quoteVolume":"23390.68069880","isFrozen":"0","high24hr":"0.01349404","low24hr":"0.01271542"},"BTC_MAID":{"id":51,"last":"0.00005014","lowestAsk":"0.00005048","highestBid":"0.00005014","percentChange":"0.03296250","baseVolume":"48.36436988","quoteVolume":"971274.78560656","isFrozen":"0","high24hr":"0.00005082","low24hr":"0.00004815"},"BTC_OMNI":{"id":58,"last":"0.00257799","lowestAsk":"0.00259060","highestBid":"0.00257799","percentChange":"-0.00884659","baseVolume":"0.58231544","quoteVolume":"224.12683914","isFrozen":"0","high24hr":"0.00265113","low24hr":"0.00255006"},"BTC_NAV":{"id":61,"last":"0.00007426","lowestAsk":"0.00007520","highestBid":"0.00007426","percentChange":"-0.01811450","baseVolume":"1.80724986","quoteVolume":"24676.56637993","isFrozen":"0","high24hr":"0.00007563","low24hr":"0.00007039"},"BTC_NEOS":{"id":63,"last":"0.00026041","lowestAsk":"0.00026084","highestBid":"0.00025877","percentChange":"0.00610439","baseVolume":"0.10391015","quoteVolume":"398.08124467","isFrozen":"0","high24hr":"0.00026293","low24hr":"0.00025877"},"BTC_NMC":{"id":64,"last":"0.00021191","lowestAsk":"0.00021192","highestBid":"0.00021191","percentChange":"0.02371980","baseVolume":"0.52372700","quoteVolume":"2562.36754640","isFrozen":"0","high24hr":"0.00021191","low24hr":"0.00019782"},"BTC_NXT":{"id":69,"last":"0.00001587","lowestAsk":"0.00001588","highestBid":"0.00001576","percentChange":"0.05518617","baseVolume":"64.61247467","quoteVolume":"4186366.12515585","isFrozen":"0","high24hr":"0.00001661","low24hr":"0.00001484"},"BTC_PINK":{"id":73,"last":"0.00000185","lowestAsk":"0.00000186","highestBid":"0.00000185","percentChange":"0.01092896","baseVolume":"0.36067062","quoteVolume":"197642.49721241","isFrozen":"0","high24hr":"0.00000187","low24hr":"0.00000176"},"BTC_POT":{"id":74,"last":"0.00001001","lowestAsk":"0.00000998","highestBid":"0.00000985","percentChange":"0.00200200","baseVolume":"4.19490950","quoteVolume":"422213.55247801","isFrozen":"0","high24hr":"0.00001040","low24hr":"0.00000982"},"BTC_PPC":{"id":75,"last":"0.00023646","lowestAsk":"0.00023425","highestBid":"0.00023294","percentChange":"-0.00458850","baseVolume":"0.79705624","quoteVolume":"3441.44637712","isFrozen":"0","high24hr":"0.00023825","low24hr":"0.00022712"},"BTC_RIC":{"id":83,"last":"0.00000775","lowestAsk":"0.00000775","highestBid":"0.00000771","percentChange":"0.00258732","baseVolume":"0.68052247","quoteVolume":"87463.98439891","isFrozen":"0","high24hr":"0.00000799","low24hr":"0.00000761"},"BTC_STR":{"id":89,"last":"0.00003175","lowestAsk":"0.00003176","highestBid":"0.00003175","percentChange":"0.00793650","baseVolume":"162.49770007","quoteVolume":"5181332.93623289","isFrozen":"0","high24hr":"0.00003237","low24hr":"0.00003031"},"BTC_SYS":{"id":92,"last":"0.00002984","lowestAsk":"0.00003023","highestBid":"0.00002974","percentChange":"0.03467406","baseVolume":"12.34678273","quoteVolume":"421900.43065328","isFrozen":"0","high24hr":"0.00003100","low24hr":"0.00002821"},"BTC_VIA":{"id":97,"last":"0.00015645","lowestAsk":"0.00015750","highestBid":"0.00015649","percentChange":"0.04894401","baseVolume":"4.42779500","quoteVolume":"28636.82745720","isFrozen":"0","high24hr":"0.00016069","low24hr":"0.00015037"},"BTC_XVC":{"id":98,"last":"0.00001227","lowestAsk":"0.00001228","highestBid":"0.00001227","percentChange":"0.03195962","baseVolume":"0.41966575","quoteVolume":"34812.07919296","isFrozen":"0","high24hr":"0.00001228","low24hr":"0.00001168"},"BTC_VRC":{"id":99,"last":"0.00004518","lowestAsk":"0.00004563","highestBid":"0.00004518","percentChange":"-0.00242879","baseVolume":"0.89416518","quoteVolume":"19435.32296154","isFrozen":"0","high24hr":"0.00004643","low24hr":"0.00004500"},"BTC_VTC":{"id":100,"last":"0.00014486","lowestAsk":"0.00014486","highestBid":"0.00014343","percentChange":"0.05291466","baseVolume":"7.99315562","quoteVolume":"56453.24767535","isFrozen":"0","high24hr":"0.00014680","low24hr":"0.00013589"},"BTC_XBC":{"id":104,"last":"0.00425235","lowestAsk":"0.00425140","highestBid":"0.00412115","percentChange":"-0.01339189","baseVolume":"0.38973891","quoteVolume":"93.87962835","isFrozen":"0","high24hr":"0.00431008","low24hr":"0.00410000"},"BTC_XCP":{"id":108,"last":"0.00129928","lowestAsk":"0.00130033","highestBid":"0.00128525","percentChange":"0.02769186","baseVolume":"1.61417091","quoteVolume":"1261.26209595","isFrozen":"0","high24hr":"0.00131134","low24hr":"0.00124263"},"BTC_XEM":{"id":112,"last":"0.00002550","lowestAsk":"0.00002550","highestBid":"0.00002543","percentChange":"0.03448275","baseVolume":"46.01188959","quoteVolume":"1837670.66738284","isFrozen":"0","high24hr":"0.00002550","low24hr":"0.00002441"},"BTC_XMR":{"id":114,"last":"0.02050000","lowestAsk":"0.02052000","highestBid":"0.02050000","percentChange":"0.08612206","baseVolume":"815.89714168","quoteVolume":"40874.61322499","isFrozen":"0","high24hr":"0.02080000","low24hr":"0.01879736"},"BTC_XPM":{"id":116,"last":"0.00020157","lowestAsk":"0.00020193","highestBid":"0.00020160","percentChange":"0.02216024","baseVolume":"5.68263390","quoteVolume":"28092.46027394","isFrozen":"0","high24hr":"0.00021000","low24hr":"0.00019441"},"BTC_XRP":{"id":117,"last":"0.00007685","lowestAsk":"0.00007696","highestBid":"0.00007686","percentChange":"0.00747246","baseVolume":"252.49637176","quoteVolume":"3265317.71390313","isFrozen":"0","high24hr":"0.00007861","low24hr":"0.00007587"},"USDT_BTC":{"id":121,"last":"6303.71999904","lowestAsk":"6303.72000000","highestBid":"6293.36663557","percentChange":"0.08948774","baseVolume":"7489314.92203924","quoteVolume":"1219.76949455","isFrozen":"0","high24hr":"6339.00000000","low24hr":"5773.68963103"},"USDT_DASH":{"id":122,"last":"244.25000000","lowestAsk":"244.00599401","highestBid":"243.99623488","percentChange":"0.08158207","baseVolume":"170737.18711357","quoteVolume":"714.40700995","isFrozen":"0","high24hr":"245.11000000","low24hr":"225.82659654"},"USDT_LTC":{"id":123,"last":"83.18269503","lowestAsk":"83.31519683","highestBid":"83.20394658","percentChange":"0.13002728","baseVolume":"861593.20900021","quoteVolume":"10680.01558715","isFrozen":"0","high24hr":"83.67170558","low24hr":"73.38570638"},"USDT_NXT":{"id":124,"last":"0.09968971","lowestAsk":"0.09969728","highestBid":"0.09944199","percentChange":"0.13754342","baseVolume":"284592.70852718","quoteVolume":"2956848.17105869","isFrozen":"0","high24hr":"0.10288428","low24hr":"0.08651038"},"USDT_STR":{"id":125,"last":"0.20000000","lowestAsk":"0.20000000","highestBid":"0.19950154","percentChange":"0.08695652","baseVolume":"1021878.05712156","quoteVolume":"5299248.93802614","isFrozen":"0","high24hr":"0.20000000","low24hr":"0.18400000"},"USDT_XMR":{"id":126,"last":"129.59609575","lowestAsk":"129.59610000","highestBid":"129.06404314","percentChange":"0.18667056","baseVolume":"646574.97268528","quoteVolume":"5238.14169499","isFrozen":"0","high24hr":"129.59609575","low24hr":"109.20983465"},"USDT_XRP":{"id":127,"last":"0.48455295","lowestAsk":"0.48453914","highestBid":"0.48342344","percentChange":"0.10109614","baseVolume":"1330727.15895762","quoteVolume":"2797504.57914151","isFrozen":"0","high24hr":"0.49150000","low24hr":"0.44003000"},"XMR_BCN":{"id":129,"last":"0.00002206","lowestAsk":"0.00002206","highestBid":"0.00002171","percentChange":"-0.00271247","baseVolume":"25.10800689","quoteVolume":"1148202.44772960","isFrozen":"0","high24hr":"0.00002387","low24hr":"0.00002058"},"XMR_BLK":{"id":130,"last":"0.00105800","lowestAsk":"0.00105133","highestBid":"0.00101685","percentChange":"-0.01764159","baseVolume":"13.11936881","quoteVolume":"12655.71120025","isFrozen":"0","high24hr":"0.00107700","low24hr":"0.00097554"},"XMR_BTCD":{"id":131,"last":"0.39439481","lowestAsk":"0.39756813","highestBid":"0.39122603","percentChange":"-0.07099275","baseVolume":"0.89947471","quoteVolume":"2.18161601","isFrozen":"0","high24hr":"0.42074688","low24hr":"0.39122603"},"XMR_DASH":{"id":132,"last":"1.91954605","lowestAsk":"1.91954320","highestBid":"1.88413172","percentChange":"-0.08199614","baseVolume":"222.10997383","quoteVolume":"112.46689554","isFrozen":"0","high24hr":"2.06561277","low24hr":"1.88131100"},"XMR_LTC":{"id":137,"last":"0.63935546","lowestAsk":"0.64326264","highestBid":"0.63908702","percentChange":"-0.05977138","baseVolume":"175.45610206","quoteVolume":"268.48628342","isFrozen":"0","high24hr":"0.68806600","low24hr":"0.63048286"},"XMR_MAID":{"id":138,"last":"0.00240633","lowestAsk":"0.00245675","highestBid":"0.00241339","percentChange":"-0.10749732","baseVolume":"13.03173231","quoteVolume":"5379.48616960","isFrozen":"0","high24hr":"0.00260438","low24hr":"0.00239077"},"XMR_NXT":{"id":140,"last":"0.00076155","lowestAsk":"0.00077690","highestBid":"0.00076345","percentChange":"-0.04999812","baseVolume":"16.81515350","quoteVolume":"22110.42844563","isFrozen":"0","high24hr":"0.00080992","low24hr":"0.00071000"},"BTC_ETH":{"id":148,"last":"0.07406023","lowestAsk":"0.07406023","highestBid":"0.07405001","percentChange":"0.01480172","baseVolume":"1227.50590773","quoteVolume":"16607.26432455","isFrozen":"0","high24hr":"0.07570715","low24hr":"0.07287128"},"USDT_ETH":{"id":149,"last":"466.95369050","lowestAsk":"466.95369050","highestBid":"466.76619436","percentChange":"0.10509181","baseVolume":"2843494.22192944","quoteVolume":"6238.52960537","isFrozen":"0","high24hr":"474.00000000","low24hr":"422.55475222"},"BTC_SC":{"id":150,"last":"0.00000170","lowestAsk":"0.00000171","highestBid":"0.00000170","percentChange":"0.05590062","baseVolume":"52.06972269","quoteVolume":"30860072.67026108","isFrozen":"0","high24hr":"0.00000175","low24hr":"0.00000160"},"BTC_BCY":{"id":151,"last":"0.00002679","lowestAsk":"0.00002679","highestBid":"0.00002607","percentChange":"-0.03840631","baseVolume":"0.14805803","quoteVolume":"5660.63702489","isFrozen":"0","high24hr":"0.00002679","low24hr":"0.00002573"},"BTC_EXP":{"id":153,"last":"0.00013966","lowestAsk":"0.00013957","highestBid":"0.00013956","percentChange":"0.01085697","baseVolume":"3.82089235","quoteVolume":"27748.98825459","isFrozen":"0","high24hr":"0.00014247","low24hr":"0.00013442"},"BTC_FCT":{"id":155,"last":"0.00159163","lowestAsk":"0.00160985","highestBid":"0.00159163","percentChange":"0.04319243","baseVolume":"29.92887739","quoteVolume":"18866.06119970","isFrozen":"0","high24hr":"0.00164999","low24hr":"0.00148416"},"BTC_RADS":{"id":158,"last":"0.00035496","lowestAsk":"0.00035456","highestBid":"0.00035000","percentChange":"0.01414245","baseVolume":"0.23345496","quoteVolume":"660.13696056","isFrozen":"0","high24hr":"0.00036050","low24hr":"0.00034009"},"BTC_AMP":{"id":160,"last":"0.00001760","lowestAsk":"0.00001760","highestBid":"0.00001758","percentChange":"0.02266124","baseVolume":"0.82499695","quoteVolume":"47254.84570813","isFrozen":"0","high24hr":"0.00001808","low24hr":"0.00001696"},"BTC_DCR":{"id":162,"last":"0.01203687","lowestAsk":"0.01212003","highestBid":"0.01204063","percentChange":"0.06173607","baseVolume":"59.96695719","quoteVolume":"5199.75205244","isFrozen":"0","high24hr":"0.01213750","low24hr":"0.01100000"},"BTC_LSK":{"id":163,"last":"0.00088769","lowestAsk":"0.00088769","highestBid":"0.00088607","percentChange":"-0.00259550","baseVolume":"28.06406919","quoteVolume":"31677.21960228","isFrozen":"0","high24hr":"0.00090096","low24hr":"0.00086919"},"ETH_LSK":{"id":166,"last":"0.01205000","lowestAsk":"0.01205000","highestBid":"0.01190621","percentChange":"-0.00487569","baseVolume":"7.99134264","quoteVolume":"671.99610673","isFrozen":"0","high24hr":"0.01224973","low24hr":"0.01174054"},"BTC_LBC":{"id":167,"last":"0.00001619","lowestAsk":"0.00001640","highestBid":"0.00001620","percentChange":"-0.01580547","baseVolume":"1.75667679","quoteVolume":"106222.76883547","isFrozen":"0","high24hr":"0.00001694","low24hr":"0.00001601"},"BTC_STEEM":{"id":168,"last":"0.00018130","lowestAsk":"0.00018137","highestBid":"0.00018051","percentChange":"-0.01723764","baseVolume":"4.29210645","quoteVolume":"23881.50823174","isFrozen":"0","high24hr":"0.00018501","low24hr":"0.00017680"},"ETH_STEEM":{"id":169,"last":"0.00243592","lowestAsk":"0.00243592","highestBid":"0.00241559","percentChange":"-0.03377917","baseVolume":"3.97280350","quoteVolume":"1634.41004949","isFrozen":"0","high24hr":"0.00250011","low24hr":"0.00238518"},"BTC_SBD":{"id":170,"last":"0.00019472","lowestAsk":"0.00019500","highestBid":"0.00019276","percentChange":"-0.07276190","baseVolume":"0.62767572","quoteVolume":"3172.94279480","isFrozen":"0","high24hr":"0.00021000","low24hr":"0.00018719"},"BTC_ETC":{"id":171,"last":"0.00250401","lowestAsk":"0.00250401","highestBid":"0.00250400","percentChange":"0.09800920","baseVolume":"149.90497396","quoteVolume":"61189.90830224","isFrozen":"0","high24hr":"0.00255000","low24hr":"0.00228050"},"ETH_ETC":{"id":172,"last":"0.03385880","lowestAsk":"0.03391876","highestBid":"0.03385881","percentChange":"0.07735292","baseVolume":"345.24507360","quoteVolume":"10396.55616969","isFrozen":"0","high24hr":"0.03420000","low24hr":"0.03133300"},"USDT_ETC":{"id":173,"last":"15.72900000","lowestAsk":"15.81122718","highestBid":"15.75911881","percentChange":"0.19184806","baseVolume":"1365550.94782547","quoteVolume":"90939.22587530","isFrozen":"0","high24hr":"16.01900110","low24hr":"13.23563048"},"BTC_REP":{"id":174,"last":"0.00507548","lowestAsk":"0.00509663","highestBid":"0.00507700","percentChange":"0.04762907","baseVolume":"17.89232066","quoteVolume":"3597.34372994","isFrozen":"0","high24hr":"0.00510365","low24hr":"0.00482216"},"USDT_REP":{"id":175,"last":"31.98790000","lowestAsk":"31.98990000","highestBid":"31.98790000","percentChange":"0.14163960","baseVolume":"62669.00988378","quoteVolume":"2044.98241077","isFrozen":"0","high24hr":"32.00000000","low24hr":"28.01926276"},"ETH_REP":{"id":176,"last":"0.06844200","lowestAsk":"0.06877741","highestBid":"0.06841640","percentChange":"0.03291560","baseVolume":"22.73544553","quoteVolume":"338.38430483","isFrozen":"0","high24hr":"0.06844200","low24hr":"0.06577282"},"BTC_ARDR":{"id":177,"last":"0.00002320","lowestAsk":"0.00002325","highestBid":"0.00002304","percentChange":"0.05598543","baseVolume":"14.02614095","quoteVolume":"616489.81335818","isFrozen":"0","high24hr":"0.00002422","low24hr":"0.00002149"},"BTC_ZEC":{"id":178,"last":"0.02755501","lowestAsk":"0.02758085","highestBid":"0.02755092","percentChange":"0.03023594","baseVolume":"68.40526401","quoteVolume":"2549.83853236","isFrozen":"0","high24hr":"0.02755501","low24hr":"0.02648180"},"ETH_ZEC":{"id":179,"last":"0.37157762","lowestAsk":"0.37174947","highestBid":"0.37141930","percentChange":"0.01247307","baseVolume":"117.09263414","quoteVolume":"321.30969349","isFrozen":"0","high24hr":"0.37157762","low24hr":"0.35737406"},"USDT_ZEC":{"id":180,"last":"174.28000000","lowestAsk":"174.28000000","highestBid":"173.31213692","percentChange":"0.12438709","baseVolume":"291938.88936583","quoteVolume":"1743.42051611","isFrozen":"0","high24hr":"174.28000000","low24hr":"155.00000000"},"XMR_ZEC":{"id":181,"last":"1.33866901","lowestAsk":"1.34620737","highestBid":"1.32387257","percentChange":"-0.05509017","baseVolume":"288.45111508","quoteVolume":"217.17260863","isFrozen":"0","high24hr":"1.43118614","low24hr":"1.28631528"},"BTC_STRAT":{"id":182,"last":"0.00038690","lowestAsk":"0.00039079","highestBid":"0.00038789","percentChange":"0.04816861","baseVolume":"22.54286057","quoteVolume":"58566.45454656","isFrozen":"0","high24hr":"0.00039632","low24hr":"0.00036631"},"BTC_NXC":{"id":183,"last":"0.00001309","lowestAsk":"0.00001325","highestBid":"0.00001309","percentChange":"0.00692307","baseVolume":"0.09690743","quoteVolume":"7401.85996538","isFrozen":"0","high24hr":"0.00001329","low24hr":"0.00001309"},"BTC_PASC":{"id":184,"last":"0.00007389","lowestAsk":"0.00007470","highestBid":"0.00007376","percentChange":"0.06316546","baseVolume":"8.36751679","quoteVolume":"116728.85972147","isFrozen":"0","high24hr":"0.00007920","low24hr":"0.00006880"},"BTC_GNT":{"id":185,"last":"0.00004847","lowestAsk":"0.00004852","highestBid":"0.00004847","percentChange":"0.06809167","baseVolume":"29.59871351","quoteVolume":"646512.61105213","isFrozen":"0","high24hr":"0.00004849","low24hr":"0.00004429"},"ETH_GNT":{"id":186,"last":"0.00065378","lowestAsk":"0.00065378","highestBid":"0.00065376","percentChange":"0.06291864","baseVolume":"60.53177568","quoteVolume":"97324.30592313","isFrozen":"0","high24hr":"0.00065378","low24hr":"0.00060711"},"BTC_GNO":{"id":187,"last":"0.00736185","lowestAsk":"0.00755551","highestBid":"0.00736186","percentChange":"0.00502660","baseVolume":"0.76517195","quoteVolume":"103.46415172","isFrozen":"0","high24hr":"0.00755963","low24hr":"0.00722031"},"ETH_GNO":{"id":188,"last":"0.09920904","lowestAsk":"0.10142223","highestBid":"0.09920904","percentChange":"-0.01773227","baseVolume":"2.80893707","quoteVolume":"28.09404631","isFrozen":"0","high24hr":"0.10143172","low24hr":"0.09870749"},"BTC_BCH":{"id":189,"last":"0.12099500","lowestAsk":"0.12099999","highestBid":"0.12058001","percentChange":"0.04315027","baseVolume":"238.13574858","quoteVolume":"1960.37823485","isFrozen":"0","high24hr":"0.12446763","low24hr":"0.11599000"},"ETH_BCH":{"id":190,"last":"1.63127405","lowestAsk":"1.63512264","highestBid":"1.63127409","percentChange":"0.02292302","baseVolume":"109.33827280","quoteVolume":"66.24652827","isFrozen":"0","high24hr":"1.67541962","low24hr":"1.59234796"},"USDT_BCH":{"id":191,"last":"761.90839551","lowestAsk":"762.59000000","highestBid":"759.59845645","percentChange":"0.13583941","baseVolume":"1627344.18835565","quoteVolume":"2170.53883386","isFrozen":"0","high24hr":"779.04833641","low24hr":"670.78883419"},"BTC_ZRX":{"id":192,"last":"0.00010922","lowestAsk":"0.00011020","highestBid":"0.00010911","percentChange":"0.04898194","baseVolume":"23.67216870","quoteVolume":"217068.63267720","isFrozen":"0","high24hr":"0.00011390","low24hr":"0.00010303"},"ETH_ZRX":{"id":193,"last":"0.00148447","lowestAsk":"0.00149146","highestBid":"0.00147761","percentChange":"0.04206240","baseVolume":"104.67595181","quoteVolume":"70759.77151815","isFrozen":"0","high24hr":"0.00153214","low24hr":"0.00141663"},"BTC_CVC":{"id":194,"last":"0.00002734","lowestAsk":"0.00002736","highestBid":"0.00002706","percentChange":"0.02282080","baseVolume":"3.23433893","quoteVolume":"121295.39360355","isFrozen":"0","high24hr":"0.00002783","low24hr":"0.00002600"},"ETH_CVC":{"id":195,"last":"0.00036852","lowestAsk":"0.00037101","highestBid":"0.00036456","percentChange":"0.00250272","baseVolume":"4.29475346","quoteVolume":"11645.97466241","isFrozen":"0","high24hr":"0.00037101","low24hr":"0.00035845"},"BTC_OMG":{"id":196,"last":"0.00126888","lowestAsk":"0.00128004","highestBid":"0.00126983","percentChange":"0.00906575","baseVolume":"7.92096989","quoteVolume":"6283.07364280","isFrozen":"0","high24hr":"0.00129349","low24hr":"0.00122845"},"ETH_OMG":{"id":197,"last":"0.01722573","lowestAsk":"0.01728067","highestBid":"0.01716737","percentChange":"0.01496008","baseVolume":"22.36082848","quoteVolume":"1301.40020601","isFrozen":"0","high24hr":"0.01754232","low24hr":"0.01682242"},"BTC_GAS":{"id":198,"last":"0.00172452","lowestAsk":"0.00172452","highestBid":"0.00171301","percentChange":"0.03109697","baseVolume":"4.60908404","quoteVolume":"2710.03247205","isFrozen":"0","high24hr":"0.00177555","low24hr":"0.00165396"},"ETH_GAS":{"id":199,"last":"0.02343869","lowestAsk":"0.02461511","highestBid":"0.02343869","percentChange":"0.01907347","baseVolume":"7.77925787","quoteVolume":"332.21256783","isFrozen":"0","high24hr":"0.02500000","low24hr":"0.02280000"},"BTC_STORJ":{"id":200,"last":"0.00007383","lowestAsk":"0.00007372","highestBid":"0.00007280","percentChange":"0.04738260","baseVolume":"1.24795266","quoteVolume":"17136.49136002","isFrozen":"0","high24hr":"0.00007501","low24hr":"0.00007010"}}');
			});
			app.config.poloniex = {
				baseUrl: baseUrl,
			};
			done();
		});
	});

	afterEach(function() {
		app.sockets.stopPollingExchangeRates();
	});

	after(function() {
		app.config.coinbase = {};
		app.config.poloniex = {};
	});

	var waitForData = function(done) {

		var receivedData;
		client.socket.on('data', function(data) {
			if (data && data.channel === channel) {
				receivedData = data.data;
			}
		});

		async.until(function() { return !!receivedData; }, function(next) {
			_.delay(next, 5);
		}, function(error) {
			if (error) return done(error);
			done(null, receivedData || null);
		});
	};

	describe('API(s) available', function() {

		beforeEach(function() {
			mockServersDown = false;
		});

		beforeEach(function() {
			app.sockets.cache[channel] = null;
			app.sockets.startPollingExchangeRates();
		});

		it('should receive data', function(done) {
			waitForData(function(error, receivedData) {
				if (error) return done(error);
				try {
					expect(receivedData).to.be.an('object');
					expect(receivedData['BTC']).to.equal('1');
				} catch (error) {
					return done(error);
				}
				done();
			});
			client.subscribe(channel);
		});
	});

	describe('API(s) unavailable', function() {

		beforeEach(function() {
			mockServersDown = true;
		});

		beforeEach(function(done) {
			_.delay(done, 100);
		});

		beforeEach(function() {
			app.sockets.cache[channel] = null;
			app.sockets.startPollingExchangeRates();
		});

		it('should NOT receive data', function(done) {

			waitForData(function(error, receivedData) {
				done(new Error('Should not have received any data'));
			});
			client.subscribe(channel);
			_.delay(done, 200);
		});

		describe('then the API(s) become available again', function() {

			beforeEach(function() {
				mockServersDown = false;
			});

			it('should receive data', function(done) {
				waitForData(function(error, receivedData) {
					if (error) return done(error);
					try {
						expect(receivedData).to.be.an('object');
						expect(receivedData['BTC']).to.equal('1');
					} catch (error) {
						return done(error);
					}
					done();
				});
				client.subscribe(channel);
			});
		});
	});
});
