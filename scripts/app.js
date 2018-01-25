let app = angular.module("MyApp", ["ngMaterial", "ngMessages"])
app.controller("MyCtrl", function($scope, $http, $filter, $timeout, $mdToast, GarHttp) {
	const base_url = "https://availability.integration2.testaroom.com";
	let today = new Date();
	let tom = new Date();
	let rowLimitChanged = 10;
	let resultsFound = 0;
	let queryCount = 0;

	tom.setDate(tom.getDate() + 1);

	$scope.params = {
		check_in: today,
		check_out: tom,
		rinfo: "[[18,18]]",
		trans_id: "67f6d937",
		api_key: "095f6d98-36cc-5975-a67a-95c48b87187d",
		auth_token: "92623a90-6c52-5cbf-88c2-f061fd003028"
	};

	$scope.queryLogs = [];
	$scope.queryComplete = false;

	$scope.listProperties = function() {
		$scope.rows = [];

		Papa.parse(
			"https://raw.githubusercontent.com/iamjigz/garApiTest/master/assets/sample.csv", {
				download: true,
				header: true,
				complete: function(rows) {
					$scope.rows = rows.data;
					$scope.fields = rows.meta.fields;
					$scope.rowLimit = rowLimitChanged;
					$scope.rowCount = rows.data.length - 1;
					$scope.showSlider = true;
					$scope.$apply();

					showMessage("Success", `${rowLimitChanged}/${$scope.rowCount} rows ready to query.`)
				}
			}
		);
	};

	$scope.queryList = function(data) {
		data = (data.startsWith("id,name")) ? data : "id,name\n" + data;

		Papa.parse(data, {
			header: true,
			complete: function(rows) {
				$scope.rows = rows.data;
				$scope.fields = ["id", "name"];

				showMessage("Success", `${rows.data.length} rows ready to query.`)
			}
		});
	};

	$scope.resetList = function(data) {
		$scope.results = "";
		$scope.rows = "";
		$scope.fields = "";

		resetLogs();
		GarHttp.resetList();

		return data = "";
	}

	let resetLogs = function() {
		$scope.queryLogs = [];
		$scope.queryComplete = false;

		resultsFound = 0;
		queryCount = 0;
	}

	$scope.updateFilteredRows = function(limit) {
		rowLimitChanged = limit;
	}

	$scope.fetch = function(params, rows) {
		let data = new FormData();

		resetLogs();
		GarHttp.resetList();
		$scope.results = GarHttp.getHotels();
		rows = $filter('limitTo')(rows, rowLimitChanged)
		showMessage("Info", `${rowLimitChanged} rows will be queried.`)

		GarHttp.getMulti(params, rows)
			.then(function(data) {
				let promise = $timeout();

				resultsFound = data.count;
				pushResult($scope.results, data.data);
				queryProgress("Multi-Property", resultsFound, `${rows.length} hotels`)

				angular.forEach(rows, function(row) {
					if (row.id != "") {
						promise = promise.then(function() {
							singleFetch(params, row);
							return $timeout(5000);
						})
					}
				});
			})
			.catch(function(err) {
				checkError(err)
			})
	};

	$scope.export = function(data) {
		let arr = $filter('limitTo')(data, rowLimitChanged);
		let result = [].concat(...arr.map((item) => item.rooms.map((rooms) => Object.assign({}, item, {
			rooms
		}))));

		console.log(arr);
		console.log(result);
	}

	let singleFetch = function(params, row) {
		GarHttp.getSingle(params, row)
			.then(function(data) {
				let outerPromise = $timeout();

				pushResult($scope.results, data.data);
				queryProgress("Single Property", data.count, row.name)

				angular.forEach(data.data, function(room) {
					if (room.hotelId && room.roomId) {
						let codes = room.rates
							.map(code => code.ratePlanCode)
							.filter((value, index, self) => self.indexOf(value) === index);

						outerPromise = outerPromise.then(function() {
							let innerPromise = $timeout();

							angular.forEach(codes, function(code) {
								innerPromise = innerPromise.then(function() {
									prebookFetch(params, {
										hotel: room.hotelId,
										room: room.roomId,
										code: code
									})
								})
								queryCount++;

								if (queryCount >= resultsFound) {
									$scope.queryComplete = true;
								}
								return $timeout(3000);
							});
							return $timeout(3000);
						})
					}
				});
			})
			.catch(function(err) {
				checkError(err)
			})
	}

	let prebookFetch = function(params, info) {
		GarHttp.getPrebook(params, info)
			.then(function(data) {
				pushResult($scope.results, data)
				queryProgress("Pre Book", _.size(data.rates), info.room)
			})
			.catch(function(err) {
				checkError(err)
			})
	};

	let showMessage = function(type, text) {
		let toast = $mdToast
			.simple()
			.hideDelay(3000)
			.textContent(`${type}: ${text}`)
			.action("Okay")
			.highlightAction(true)
			.highlightClass("md-secondary")
			.position("top right");

		if (type == "Error") {
			$mdToast.show(toast).then(function(res) {
				if (res == "ok") {}
			});
		}

		$scope.queryLogs.push({
			type: type,
			title: type,
			message: text
		})
	};

	let queryProgress = function(reqType, count, name) {
		let type = (count > 0) ? "Success" : "Info";

		$scope.queryLogs.push({
			type: type,
			title: reqType,
			message: `${count} results found for ${name}. `
		})
	}

	let checkError = function(err) {
		if (err.status == -1) {
			showMessage("Error", `Could not connect to ${err.config.url}. Please check if CORS is enabled.`)
			console.log(err)

		} else {
			showMessage("Error", err.statusText ? err.statusText : "Unknown error occured.")
			console.log(err)
		}
	};
});