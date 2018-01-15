angular
  .module("MyApp", ["ngMaterial"])
  .controller("MyCtrl", function($scope, $http, $timeout, $q) {
    const base_url = "https://availability.integration2.testaroom.com";
    let today = new Date();
    let tom = new Date();

    tom.setDate(tom.getDate() + 1);

    $scope.rows = [];

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

    $scope.listProperties = function() {
      let url = `https://book.integration2.testaroom.com/api/properties.csv?api_key=${
        $scope.auth.api_key
      }&auth_token=${$scope.auth.auth_token}`;

      Papa.parse(
        "https://raw.githubusercontent.com/iamjigz/garApiTest/master/assets/sample.csv",
        {
          download: true,
          header: true,
          complete: function(rows) {
            $scope.rows = rows.data;
            $scope.fields = rows.meta.fields;
            $scope.$apply();
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
        }
      });
    };

    $scope.fetch = function(req, rows) {
      let data = new FormData();
      $scope.message = {};
      $scope.results = [];
      $scope.hotelsCount = 0;
      $scope.multiCount = 0;
      $scope.singleCount = 0;
      $scope.prebookCount = 0;
      
      multiFetch(req, rows);
    };

    let formatDate = function(date) {
      return moment(date).format("MM/DD/YYYY");
    };

    let multiFetch = function(req, rows) {
      let multiFetchUrl = `${base_url}/api/1.1/room_availability?check_in=${formatDate(
        req.check_in
      )}&check_out=${formatDate(req.check_out)}&cancellation_rules=${
        req.cancellation_rules
      }&api_key=${$scope.auth.api_key}&auth_token=${
        $scope.auth.auth_token
      }&rinfo=${req.rinfo}&transaction_id=${req.trans_id}`;

      let fd = new FormData();

      angular.forEach(rows, function(row) {
        if (row.id != "") {
          $scope.hotelsCount++;
          fd.append("property_id[]", row.id);

          $scope.results.push({
            hotelId: row.id,
            hotelName: row.name,
            rooms: []
          });
        }
      });

      let post = {
        method: "POST",
        url: multiFetchUrl,
        headers: { "Content-Type": undefined },
        data: fd,
        timeout: 10000
      };

      $http(post)
        .success(function(res) {
          let x2js = new X2JS();
          let data = x2js.xml_str2json(res);
          let rooms = [];

          angular.forEach(data["room-stays"]["room-stay"], function(room) {
            $scope.multiCount++;

            rooms.push({
              hotelId: room.room["hotel-id"] || "Unlisted",
              roomId: room.room["room-id"],
              title: room.room.title.__text || "Unlisted",
              description: room.room.description.__text || "Unlisted",   
              url: room["landing-url"] || "Unlisted",                       
              rates: [
                {
                  ratePlanCode: room["rate-plan-code"] || "Unlisted",
                  displayPrice: room["display-pricing"].total || "Unlisted",
                  requestType: "Multi Property"
                }
              ]
            });
          });

          pushResult($scope.results, rooms, "Multi Property");

          angular.forEach(rows, function(row) {
            if (row.id != "") {
              $timeout(singleFetch(req, row.id), 10000);
            }
          });

        })
        .catch(function(err) {
          $scope.message = {
            type: "Error",
            text: err.statusText
          };
        });
    };

    let singleFetch = function(req, id) {
      let singleUrl = `${base_url}/api/1.1/properties/${id}/room_availability?check_in=${formatDate(
        req.check_in
      )}&check_out=${formatDate(req.check_out)}&cancellation_rules=${
        req.cancellation_rules
      }&api_key=${$scope.auth.api_key}&auth_token=${
        $scope.auth.auth_token
      }&rinfo=${req.rinfo}&transaction_id=${req.trans_id}`;

      $http
        .get(singleUrl, { timeout: 10000 })
        .success(function(res) {
          let x2js = new X2JS();
          let data = x2js.xml_str2json(res);
          let rooms = [];

          angular.forEach(data["room-stays"]["room-stay"], function(room) {
            $scope.singleCount++;

            rooms.push({
              hotelId: room.room["hotel-id"],
              roomId: room.room["room-id"],
              title: room.room.title.__text || "Unlisted",
              url: room["landing-url"] || "Unlisted",
              rates: [
                {
                  ratePlanCode: room["rate-plan-code"] || "Unlisted",
                  displayPrice: room["display-pricing"].total || "Unlisted",
                  requestType: "Single Property"
                }
              ]
            });
          });

          pushResult($scope.results, rooms, "Single Property");

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
          $scope.message = {
            type: "Error",
            text: err.statusText
          };
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
        .get(prebookUrl, { timeout: 10000 })
        .success(function(res) {
          let x2js = new X2JS();
          let data = x2js.xml_str2json(res);
          let rooms = [];
          let room = data["room-stays"]["room-stay"];

          $scope.prebookCount++;

          rooms.push({
            hotelId: room.room["hotel-id"],
            roomId: room.room["room-id"],
            title: room.room.title.__text || "Unlisted",
            url: room["landing-url"] || "Unlisted",
            rates: [
              {
                ratePlanCode: room["rate-plan-code"] || "Unlisted",
                displayPrice: room["display-pricing"].total || "Unlisted",
                requestType: "Pre Book"
              }
            ]
          });

          pushResult($scope.results, rooms, "Pre-book");
        })
        .catch(function(err) {
          $scope.message = { type: "Error", text: err.statusText };
        });
    };

    let pushResult = function(result, data, type) {
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

        if (hotel + 1 === result.length  && type == "Pre-book") {
          $scope.message = { type: "Finished", text: `All requests for ${result.length} hotels done.` };            
       
        } else if (hotel + 1 === result.length) {
          $scope.message = { type: "Finished", text: `${hotel + 1} ${type} requests for ${result.length} hotels.` };
        } else {
          $scope.message = { type: "Running", text: `${hotel + 1} ${type} requests for ${result.length} hotels.` };
        }
      }
    };

    let comparePrice = function(data, index) {
      console.log(data.ratePlanCode);
      console.log(data.displayPrice);
      console.log($scope.compare);
    }
  });
