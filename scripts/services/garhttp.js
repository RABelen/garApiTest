app.factory("GarHttp", function($http, $q) {
	const base_url = "https://availability.integration2.testaroom.com";
	let hotels = [];

	return {
		getHotels: function() {
			return hotels;
		},
		// updateRooms: function(rooms, requestType) {
		// 	let promise = $q.all([]);
		// 	let data = [];
		//
		// 	angular.forEach(rooms, function(room) {
		// 		promise = promise.then(function() {
		// 			data.push({
		// 				hotelId: room.room["hotel-id"] || "Unlisted",
		// 				roomId: room.room["room-id"],
		// 				title: room.room.title.__text || "Unlisted",
		// 				description: room.room.description.__text || "Unlisted",
		// 				url: room["landing-url"] || "Unlisted",
		// 				rates: [{
		// 					ratePlanCode: room["rate-plan-code"] || "Unlisted",
		// 					displayPrice: room["display-pricing"].total || "Unlisted",
		// 					requestType: requestType
		// 				}]
		// 			});
		// 		})
		// 	});
		//
		// 	promise.finally(function() {
		// 		return data;
		// 	})
		// },
		getMulti: function(params, rows) {
			let deferred = $q.defer();
			let url = `${base_url}/api/1.1/room_availability?check_in=${formatDate(params.check_in)}&check_out=${formatDate(params.check_out)}&api_key=${params.api_key}&auth_token=${params.auth_token}&rinfo=${params.rinfo}&transaction_id=${params.trans_id}`;

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
					deferred.resolve(json);
				})
				.catch(function(err) {
					let json = toJson(err);
					deferred.reject(json);
				});

			return deferred.promise;
		}
	}
})