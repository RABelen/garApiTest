app.factory("GarHttp", function($http, $q, $timeout) {
	const base_url = "https://availability.integration2.testaroom.com";
	let hotels = [];

	return {
		getHotels: function() {
			return hotels;
		},
		resetList: function() {
			return hotels = [];
		},
		getMulti: function(params, rows) {
			let deferred = $q.defer();
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
					let updateData = updateRoomData(rooms, "Multi-Property");
					let data = {
						data: updateData,
						count: _.size(rooms)
					}

					deferred.resolve(data);
				})
				.catch(function(err) {
					deferred.reject(err);
				});

			return deferred.promise;
		},
		getSingle: function(params, row) {
			let deferred = $q.defer();
			let url = base_url + "/api/1.1/properties/" + row.id + "/room_availability?check_in=" + formatDate(params.check_in) +
				"&check_out=" + formatDate(params.check_out) +
				"&api_key=" + params.api_key +
				"&auth_token=" + params.auth_token +
				"&rinfo=" + params.rinfo +
				"&transaction_id=" + params.trans_id;

			$http
				.get(url, {
					timeout: 10000
				})
				.success(function(res) {
					let json = toJson(res);
					let rooms = json["room-stays"]["room-stay"];
					let updateData = updateRoomData(rooms, "Single Property");
					let data = {
						data: updateData,
						count: _.size(rooms)
					}

					deferred.resolve(data);
				})
				.catch(function(err) {
					deferred.reject(err);
				});

			return deferred.promise;
		},
		getPrebook: function(params, info) {
			let deferred = $q.defer();
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
					let json = toJson(res);
					let rooms = json["room-stays"]["room-stay"];
					let updateData = updateRoomData(rooms, "Pre Book");

					deferred.resolve(updateData);
				})
				.catch(function(err) {
					deferred.reject(err);
				});

			return deferred.promise;
		}
	}
})