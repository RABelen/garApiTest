let app = angular.module("MyApp", ["ngMaterial"])
app.controller("MyCtrl", function($scope, $http, $q, $timeout, $mdToast, GarHttp) {
	const base_url = "https://availability.integration2.testaroom.com";
	let today = new Date();
	let tom = new Date();

	tom.setDate(tom.getDate() + 1);

	$scope.auth = {
		api_key: "095f6d98-36cc-5975-a67a-95c48b87187d",
		auth_token: "92623a90-6c52-5cbf-88c2-f061fd003028"
	};

	$scope.params = {
		check_in: today,
		check_out: tom,
		cancellation_rules: 1,
		rinfo: "[[18,18]]",
		trans_id: "67f6d937"
	};

	$scope.queryLogs = [];

	$scope.listProperties = function() {
		Papa.parse(
			"https://raw.githubusercontent.com/iamjigz/garApiTest/master/assets/sample.csv", {
				download: true,
				header: true,
				complete: function(rows) {
					$scope.rows = rows.data;
					$scope.fields = rows.meta.fields;
					$scope.$apply();

					showMessage("Success", `${rows.data.length - 1} rows ready to query.`)
				}
			}
		);
	};

	$scope.queryList = function(data) {
		Papa.parse("id,name\n" + data, {
			header: true,
			complete: function(rows) {
				$scope.rows = rows.data;
				$scope.fields = ["id", "name"];

				showMessage("Success", `${rows.data.length} rows ready to query.`)
			}
		});
	};

	$scope.resetList = function() {
		$scope.results = "";
		$scope.rows = "";
		$scope.fields = "";
		$scope.userInput = "";

		GarHttp.resetList();
	}

	$scope.fetch = function(req, rows) {
		let data = new FormData();
		$scope.results = GarHttp.getHotels();

		/// TODO: Sync with scope
		let params = {
			check_in: today,
			check_out: tom,
			rinfo: "[[18,18]]",
			trans_id: "67f6d937",
			api_key: "095f6d98-36cc-5975-a67a-95c48b87187d",
			auth_token: "92623a90-6c52-5cbf-88c2-f061fd003028"
		}

		GarHttp.getMulti(params, rows)
			.then(function(data) {
				let rooms = data["room-stays"]["room-stay"];
				let updateData = updateRoomData(rooms, "Multi-Property");

				pushResult($scope.results, updateData);
				showMessage("Success", `${_.size(rooms)} rate plans found from multi-property request for ${rows.length} hotels.`)

				angular.forEach(rows, function(row) {
					if (row.id != "") {
						// $timeout(singleFetch(params, row.id), 10000);
						GarHttp.getSingle(params, row)
							.then(function(data) {
								let rooms = data["room-stays"]["room-stay"];
								let updateData = updateRoomData(rooms, "Single Property");

								pushResult($scope.results, updateData);
								showMessage("Success", `${_.size(rooms)} rate plans found from single property request for ${row.name}.`)

								angular.forEach(updateData, function(room) {
									let codes = room.rates
										.map(code => code.ratePlanCode)
										.filter((value, index, self) => self.indexOf(value) === index);

									angular.forEach(codes, function(code) {
										$timeout(
											prebookFetch(req, {
												hotel: room.hotelId,
												room: room.roomId,
												code: code
											}),
											10000
										);
									});
								});
							})
							.catch(function(err) {
								showMessage("Error", "Please check if CORS is enabled.")
							})
					}
				});

			})
			.catch(function(err) {
				showMessage("Error", "Please check if CORS is enabled.")
				$scope.resetList();
			})
	};

	// let multiFetch = function(req, rows) {
	// 	let multiFetchUrl = `${base_url}/api/1.1/room_availability?check_in=${formatDate(
	//     req.check_in
	//   )}&check_out=${formatDate(req.check_out)}&cancellation_rules=${
	//     req.cancellation_rules
	//   }&api_key=${$scope.auth.api_key}&auth_token=${
	//     $scope.auth.auth_token
	//   }&rinfo=${req.rinfo}&transaction_id=${req.trans_id}`;
	//
	// 	let fd = new FormData();
	//
	// 	angular.forEach(rows, function(row) {
	// 		if (row.id != "") {
	// 			$scope.hotelsCount++;
	// 			fd.append("property_id[]", row.id);
	//
	// 			$scope.results.push({
	// 				hotelId: row.id,
	// 				hotelName: row.name,
	// 				rooms: []
	// 			});
	// 		}
	// 	});
	//
	// 	let post = {
	// 		method: "POST",
	// 		url: multiFetchUrl,
	// 		headers: {
	// 			"Content-Type": undefined
	// 		},
	// 		data: fd,
	// 		timeout: 10000
	// 	};
	//
	// 	$http(post)
	// 		.success(function(res) {
	// 			let x2js = new X2JS();
	// 			let data = x2js.xml_str2json(res);
	// 			let rooms = [];
	//
	// 			angular.forEach(data["room-stays"]["room-stay"], function(room) {
	// 				$scope.multiCount++;
	//
	// 				rooms.push({
	// 					hotelId: room.room["hotel-id"] || "Unlisted",
	// 					roomId: room.room["room-id"],
	// 					title: room.room.title.__text || "Unlisted",
	// 					description: room.room.description.__text || "Unlisted",
	// 					url: room["landing-url"] || "Unlisted",
	// 					rates: [{
	// 						ratePlanCode: room["rate-plan-code"] || "Unlisted",
	// 						displayPrice: room["display-pricing"].total || "Unlisted",
	// 						requestType: "Multi Property"
	// 					}]
	// 				});
	// 			});
	//
	// 			pushResult($scope.results, rooms);
	//
	// 			angular.forEach(rows, function(row) {
	// 				if (row.id != "") {
	// 					$timeout(singleFetch(req, row.id), 10000);
	// 				}
	// 			});
	// 		})
	// 		.catch(function(err) {
	// 			if (err.status == -1) {
	// 				showMessage(
	// 					"Error",
	// 					"No 'Access-Control-Allow-Origin' header is present on the requested resource."
	// 				);
	// 			} else {
	// 				showMessage(
	// 					"Error",
	// 					err.statusText
	// 				);
	// 			}
	// 		});
	// };

	let singleFetch = function(req, id) {
		let singleUrl = `${base_url}/api/1.1/properties/${id}/room_availability?check_in=${formatDate(
        req.check_in
      )}&check_out=${formatDate(req.check_out)}&cancellation_rules=${
        req.cancellation_rules
      }&api_key=${$scope.auth.api_key}&auth_token=${
        $scope.auth.auth_token
      }&rinfo=${req.rinfo}&transaction_id=${req.trans_id}`;

		$http
			.get(singleUrl, {
				timeout: 10000
			})
			.success(function(res) {
				let x2js = new X2JS();
				let data = x2js.xml_str2json(res);
				let rooms = [];

				angular.forEach(data["room-stays"]["room-stay"], function(room) {
					$scope.singleCount++;

					rooms.push({
						hotelId: room.room["hotel-id"] || "Unlisted",
						roomId: room.room["room-id"] || "Unlisted",
						title: room.room.title.__text || "Unlisted",
						url: room["landing-url"] || "Unlisted",
						rates: [{
							ratePlanCode: room["rate-plan-code"] || "Unlisted",
							displayPrice: room["display-pricing"].total || "Unlisted",
							requestType: "Single Property"
						}]
					});
				});

				pushResult($scope.results, rooms);

				angular.forEach(rooms, function(room) {
					let codes = room.rates
						.map(code => code.ratePlanCode)
						.filter((value, index, self) => self.indexOf(value) === index);

					angular.forEach(codes, function(code) {
						$timeout(
							prebookFetch(req, {
								hotel: room.hotelId,
								room: room.roomId,
								code: code
							}),
							10000
						);
					});
				});
			})
			.catch(function(err) {
				if (err.status == -1) {
					showMessage(
						"Error",
						"No 'Access-Control-Allow-Origin' header is present on the requested resource."
					);
				} else {
					showMessage(
						"Error",
						err.statusText
					);
				}
			});
	};

	let prebookFetch = function(req, params) {
		let prebookUrl = `${base_url}/api/1.1/properties/${
        params.hotel
      }/room_availability?check_in=${formatDate(
        req.check_in
      )}&check_out=${formatDate(req.check_out)}&cancellation_rules=${
        req.cancellation_rules
      }&room_id=${params.room}&rate_plan_code=${params.code}&api_key=${
        $scope.auth.api_key
      }&auth_token=${$scope.auth.auth_token}&rinfo=${
        req.rinfo
      }&transaction_id=${req.trans_id}`;

		$http
			.get(prebookUrl, {
				timeout: 10000
			})
			.success(function(res) {
				let x2js = new X2JS();
				let data = x2js.xml_str2json(res);
				let rooms = [];
				let room = data["room-stays"]["room-stay"];

				$scope.prebookCount++;

				rooms.push({
					hotelId: room.room["hotel-id"] || "Unlisted",
					roomId: room.room["room-id"] || "Unlisted",
					title: room.room.title.__text || "Unlisted",
					url: room["landing-url"] || "Unlisted",
					rates: [{
						ratePlanCode: room["rate-plan-code"] || "Unlisted",
						displayPrice: room["display-pricing"].total || "Unlisted",
						requestType: "Pre Book"
					}]
				});

				pushResult($scope.results, rooms)
			})
			.catch(function(err) {
				if (err.status == -1) {
					showMessage(
						"Error",
						"No 'Access-Control-Allow-Origin' header is present on the requested resource."
					);
				} else {
					showMessage(
						"Error",
						err.statusText
					);
				}
			});
	};

	let showMessage = function(type, text) {
		let toast = $mdToast
			.simple()
			.hideDelay(10000)
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
});