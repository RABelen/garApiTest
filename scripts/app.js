let app = angular.module("MyApp", ["ngMaterial", "ngMessages"])
app.controller("MyCtrl", function($scope, $http, $filter, $q, $timeout, $mdToast, GarHttp) {
	const base_url = "https://availability.integration2.testaroom.com";
	let today = new Date();
	let tom = new Date();
	let rowLimitChanged = 10;

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

					showMessage("Success", `${$scope.rowLimit}/${$scope.rowCount} rows ready to query.`)
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
		GarHttp.resetList();

		return data = "";
	}

	$scope.updateFilteredRows = function(limit) {
		rowLimitChanged = limit;
	}

	$scope.fetch = function(params, rows) {
		let data = new FormData();
		GarHttp.resetList();
		$scope.results = GarHttp.getHotels();

		rows = $filter('limitTo')(rows, rowLimitChanged)

		GarHttp.getMulti(params, rows)
			.then(function(data) {
				let rooms = data["room-stays"]["room-stay"];
				let updateData = updateRoomData(rooms, "Multi-Property");
				let promises = [];

				pushResult($scope.results, updateData);
				showMessage("Success", `${_.size(rooms)} results found from multi-property request for ${rows.length} hotels.`)

				angular.forEach(rows, function(row) {
					let defer = $q.defer();
					promises.push(defer.promise);

					if (row.id != "") {
						$timeout(function() {
							singleFetch(params, row);
							defer.resolve();
						}, 10000)
					}
				});

				$q.all(promises).then(function() {
					console.log("All Done")
				})
			})
			.catch(function(err) {
				checkError(err)
			})
	};

	let singleFetch = function(params, row) {
		GarHttp.getSingle(params, row)
			.then(function(data) {
				let rooms = data["room-stays"]["room-stay"];
				let updateData = updateRoomData(rooms, "Single Property");
				let outerPromises = [];

				pushResult($scope.results, updateData);
				showMessage("Success", `${_.size(rooms)} rate plans found from single property request for ${row.name}.`)

				angular.forEach(updateData, function(room) {
					let outerDefer = $q.defer();
					outerPromises.push(outerDefer.promise);

					if (room.hotelId && room.roomId) {
						let innerPromises = [];
						let codes = room.rates
							.map(code => code.ratePlanCode)
							.filter((value, index, self) => self.indexOf(value) === index);

						angular.forEach(codes, function(code) {
							let innerDefer = $q.defer();
							innerPromises.push(innerDefer.promise);

							$timeout(function() {
								innerDefer.resolve()
								prebookFetch(params, {
									hotel: room.hotelId,
									room: room.roomId,
									code: code
								})
							}, 10000)
						});
						$q.all(innerPromises).then(outerDefer.resolve());
					}
				});
			})
			.catch(function(err) {
				checkError(err)
			})
	}

	let prebookFetch = function(params, info) {
		let url = base_url + "/api/1.1/properties/" + info.hotel + "/room_availability?check_in=" + formatDate(params.check_in) +
			"&check_out=" + formatDate(params.check_out) +
			"&room_id=" + info.room +
			"&rate_plan_code=" + info.code +
			"&api_key=" + params.api_key +
			"&auth_token=" + params.auth_token +
			"&rinfo=" + params.rinfo +
			"&transaction_id=" + params.trans_id;

		$http
			.get(url, {
				timeout: 10000
			})
			.success(function(res) {
				let x2js = new X2JS();
				let data = x2js.xml_str2json(res);
				let rooms = [];
				let room = data["room-stays"]["room-stay"];

				if (room) {
					rooms.push({
						hotelId: room.room != undefined ? room.room["hotel-id"] : "Unlisted",
						roomId: room.room != undefined ? room.room["room-id"] : "Unlisted",
						title: room.room != undefined ? room.room.title.__text : "Unlisted",
						description: room.room != undefined ? room.room.description.__text : "Unlisted",
						url: room["landing-url"] != undefined ? room["landing-url"] : "Unlisted",
						rates: [{
							ratePlanCode: room["rate-plan-code"] != undefined ? room["rate-plan-code"] : "Unlisted",
							displayPrice: room["display-pricing"] != undefined ? room["display-pricing"].total : "Unlisted",
							requestType: "Pre book"
						}]
					});
					pushResult($scope.results, rooms)
				}
			})
			.catch(function(err) {
				checkError(err)
			});
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

		$mdToast.show(toast).then(function(res) {
			if (res == "ok") {}
		});

		$scope.queryLogs.push({
			type: type,
			message: text
		})
	};

	let checkError = function(err) {
		if (err.status == -1) {
			showMessage("Error", "Please check if CORS is enabled.")
			console.log(err)

		} else {
			showMessage("Error", err.statusText ? err.statusText : "Unknown error occured.")
			console.log(err)
		}
	};
});