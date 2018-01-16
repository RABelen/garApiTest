let formatDate = function(date) {
  return moment(date).format("MM/DD/YYYY");
};

let pushResult = function(result, data) { 
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
};

let comparePrice = function(data, index) {
  console.log(data.ratePlanCode);
  console.log(data.displayPrice);
  console.log($scope.compare);
};
