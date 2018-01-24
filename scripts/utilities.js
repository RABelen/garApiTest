/**
 * Formats date to MM/DD/YYYY
 * @param  {[type]} date [Date Object to format]
 * @return {[type]}      [Date object formatted to MM/DD/YYYY]
 */
function formatDate(date) {
	return moment(date).format("MM/DD/YYYY");
}

/**
 * Pushes room data to corresponding hotel
 * Pushes rate plan data to corresponding room
 * @param  {[type]} result [Hotel object]
 * @param  {[type]} data   [Response object containing room or rate plan data]
 */
function pushResult(result, data) {
	for (let hotel = 0; hotel < result.length; hotel++) {
		for (let room = 0; room < data.length; room++) {
			if (data[room].hotelId == result[hotel].hotelId) {
				let filter = _.find(result[hotel].rooms, {
					roomId: data[room].roomId
				});
				if (filter) {
					filter.rates.push(data[room].rates[0]);
				} else {
					result[hotel].rooms.push(data[room]);
				}
			}
		}
	}
}

function updateRoomData(rooms, requestType) {
	let data = [];

	if (rooms) {
		let pushObj = function(room) {
			data.push({
				hotelId: room.room != undefined ? room.room["hotel-id"] : undefined,
				roomId: room.room != undefined ? room.room["room-id"] : undefined,
				title: room.room != undefined ? room.room.title.__text : "Unlisted",
				description: room.room != undefined ? room.room.description.__text : "Unlisted",
				url: room["landing-url"] != undefined ? room["landing-url"] : "Unlisted",
				rates: [{
					ratePlanCode: room["rate-plan-code"] != undefined ? room["rate-plan-code"] : "Unlisted",
					displayPrice: room["display-pricing"] != undefined ? room["display-pricing"].total : "Unlisted",
					requestType: requestType
				}]
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

/**
 * Transforms xml object to json
 * @param  {[type]} xml [XML object to convert]
 * @return {[type]}     [JSON object]
 */
function toJson(xml) {
	let x2js = new X2JS();
	let data = x2js.xml_str2json(xml);

	if (data) return data;
}

function checkError(err) {
	if (err.status == -1) {
		showMessage("Error", `Could not connect to ${err.config.url}. Please check if CORS is enabled.`)
		console.log(err)

	} else {
		showMessage("Error", err.statusText ? err.statusText : "Unknown error occured.")
		console.log(err)
	}
};