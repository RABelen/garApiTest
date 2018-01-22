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

	angular.forEach(rooms, function(room) {
		data.push({
			hotelId: room.room["hotel-id"] || "Unlisted",
			roomId: room.room["room-id"] || "Unlisted",
			title: room.room.title.__text || "Unlisted",
			description: room.room.description.__text || "Unlisted",
			url: room["landing-url"] || "Unlisted",
			rates: [{
				ratePlanCode: room["rate-plan-code"] || "Unlisted",
				displayPrice: room["display-pricing"].total || "Unlisted",
				requestType: requestType
			}]
		});
	});

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

let comparePrice = function(data, index) {
	console.log(data.ratePlanCode);
	console.log(data.displayPrice);
};