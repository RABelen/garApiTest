angular
  .module("MyApp", ["ngMaterial"])
  .controller("MyCtrl", function($scope, $http, $timeout) {
    const base_url = "https://availability.integration2.testaroom.com";
    let today = new Date();
    let tom = new Date();

    tom.setDate(tom.getDate() + 1);

    let auth = {
      api_key: "095f6d98-36cc-5975-a67a-95c48b87187d",
      auth_token: "92623a90-6c52-5cbf-88c2-f061fd003028"
    };

    $scope.params = {
      check_in: today,
      check_out: tom,
      nights: 1,
      cancellation_rules: 1,
      rinfo: "[[18,18]]",
      trans_id: "67f6d937"
    };

    $scope.listProperties = function() {
      let url = `https://book.integration2.testaroom.com/api/properties.csv?api_key=${
        auth.api_key
      }&auth_token=${auth.auth_token}`;

      Papa.parse("/assets/sample.csv", {
        download: true,
        header: true,
        complete: function(rows) {
          $scope.rows = rows.data;
          $scope.fields = rows.meta.fields;
          $scope.$apply();
        }
      });
    };

    $scope.fetch = function(req, rows) {
      let data = new FormData();
      $scope.results = [];
      $scope.hotelsCount = 0;
      $scope.roomsCount = 0;

      multiFetch(req, rows);

      // angular.forEach(rows[0], function(row) {
      //   promise = promises.then(function() {
      //     multiFetch(req, row, function(data) {
      //       console.log(data);
      //     })
      //     return $timeout(5000);
      //   })
      // })
    };

    let formatDate = function(date) {
      return moment(date).format("MM/DD/YYYY");
    };

    let multiFetch = function(req, rows) {
      let multiFetchUrl = `${base_url}/api/1.1/room_availability?check_in=${formatDate(
        req.check_in
      )}&check_out=${formatDate(req.check_out)}&cancellation_rules=${
        req.cancellation_rules
      }&api_key=${auth.api_key}&auth_token=${auth.auth_token}&rinfo=${
        req.rinfo
      }&transaction_id=${req.trans_id}`;

      let fd = new FormData();

      angular.forEach(rows, function(row) {
        if (row.id != "") {
          $scope.hotelsCount++;
          fd.append("property_id[]", row.id);

          $scope.results.push({
            hotelId: row.id,
            hotelName: row.name,
            rooms: [{
              multi: {},
              single: {},
              prebook: {}
            }]
          });
        }
      });

      let post = {
        method: "POST",
        url: multiFetchUrl,
        headers: { "Content-Type": undefined },
        data: fd,
        timeout: 5000
      };

      $http(post)
        .success(function(res) {
          let x2js = new X2JS();
          let data = x2js.xml_str2json(res);
          let rooms = [];

          console.log(data);

          angular.forEach(data["room-stays"]["room-stay"], function(room) {
            $scope.roomsCount++;

            rooms.push({
              hotelId: room.room["hotel-id"],
              roomId: room.room["room-id"],
              title: room.room.title.__text,
              url: room["landing-url"],
              ratePlanCode: room["rate-plan-code"],
              displayPrice: room["display-pricing"].total,
              bookingPrice: room["booking-pricing"].total
            });
          });

          for (let hotel = 0; hotel < $scope.results.length; hotel++) {
            $scope.results[hotel].rooms.multi = [];
            
            for (let room = 0; room < rooms.length; room++) {
              if (rooms[room].hotelId == $scope.results[hotel].hotelId) {
                $scope.results[hotel].rooms.multi.push(rooms[room]);
                singleFetch(req, rooms[room].hotelId);  
              }
            }
          }
        })
        .catch(function(err) {
          let x2js = new X2JS();
          let error = x2js.xml_str2json(err);
          $scope.error = `Error. ${err.statusText}`;

          console.log(error);
        });
    };

    let singleFetch = function(req, row) {
      let singleUrl = `${base_url}/api/1.1/properties/${
        row.id
      }/room_availability?check_in=${formatDate(
        req.check_in
      )}&check_out=${formatDate(req.check_out)}&cancellation_rules=${
        req.cancellation_rules
      }&api_key=${auth.api_key}&auth_token=${auth.auth_token}&rinfo=${
        req.rinfo
      }&transaction_id=${req.trans_id}`;

      $http
        .get(singleUrl)
        .success(function(res) {
          let x2js = new X2JS();
          let data = x2js.xml_str2json(res);
          // let result = angular.extend({}, row, data);

          console.log(data);
          // return result;
        })
        .catch(function(err) {
          let x2js = new X2JS();
          let error = x2js.xml_str2json(err);
          $scope.error = `Error. ${err.statusText}`;

          console.log(error);
        });
    };
  });
