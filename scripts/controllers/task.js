app.controller("TaskCtrl", function($scope, $http) {
	const base_url = "https://availability.integration2.testaroom.com";
	let hotels = [];

	$scope.fetchFees = function(params, rows) {
		let url = base_url + "/api/1.1/room_availability?check_in=" + formatDate(params.check_in) +
			"&check_out=" + formatDate(params.check_out) +
			"&api_key=" + params.api_key +
			"&auth_token=" + params.auth_token +
			"&rinfo=" + params.rinfo +
			"&transaction_id=" + params.trans_id;
		let fd = new FormData();

		angular.forEach(rows, function(row) {
			if (row.id != "") {
				fd.append("property_id[]", row.id);

				hotels.push({
					hotelId: row.id,
					hotelName: row.name,
					rooms: []
				});
			}
		});

		$http({
				method: "POST",
				url: url,
				headers: {
					"Content-Type": undefined
				},
				data: fd,
				timeout: 10000
			})
			.success(function(res) {
				let json = toJson(res);
				let rooms = json["room-stays"]["room-stay"];
				let updated = updateData(rooms, "Multi-Property");

				$scope.response = updated

				console.log(updated)
			})
			.catch(function(err) {
				return err
			});

	}

	$scope.export = function(data) {
		let csv = Papa.unparse(data);

		if (csv == null) return;
		if (!csv.match(/^data:text\/csv/i)) {
			csv = 'data:text/csv;charset=utf-8,' + csv;
		}

		let file = encodeURI(csv);
		let link = document.createElement('a');
		link.setAttribute('href', file);
		link.setAttribute('download', 'csv-export.csv');
		link.click();

		console.log(csv)
	}

	function updateData(rooms, requestType) {
		let data = [];

		if (rooms) {
			let pushObj = function(room) {
				data.push({
					hotelId: room.room != undefined ? room.room["hotel-id"] : "",
					title: room.room != undefined ? room.room.title.__text : "",
					// fees: room["fees-collected-at-property"].fee != undefined ? room["fees-collected-at-property"].fee : "Unlisted",
					total: _.has(room["fees-collected-at-property"].fee, 'total') ? room["fees-collected-at-property"].fee.total : "",
					fee: _.has(room["fees-collected-at-property"].fee, 'name') ? room["fees-collected-at-property"].fee.name.__text : ""
				});
			}
			if (rooms.length > 0) {
				angular.forEach(rooms, function(room) {
					if (room != undefined) {
						pushObj(room)
					}
				});
			} else {
				pushObj(rooms)
			}
		}
		return data;
	}
})