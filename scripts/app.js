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
      nights: "",
      cancellation_rules: 1,
      rinfo: [[18, 18]],
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
      let promises = $timeout();

      $scope.output = {};

      angular.forEach(rows, function(row) {
        promise = promises.then(function() {
          multiFetch(req, row.id, function(data) {
            console.log(data);
          })
          return $timeout(5000);
        })
      })
    };

    let multiFetch = function(req, id) {
      let data = new FormData();

      data.append("property_id[]", id);

      let formatDate = function(date) {
        return moment(date).format("MM/DD/YYYY");
      };

      $scope.multiFetchUrl = `${base_url}/api/1.1/room_availability?check_in=${formatDate(
        req.check_in
      )}&check_out=${formatDate(req.check_out)}&cancellation_rules=${
        req.cancellation_rules
      }&api_key=${auth.api_key}&auth_token=${auth.auth_token}&rinfo=${
        req.rinfo
      }&transaction_id=${req.trans_id}`;

      let post = {
        method: "POST",
        url: $scope.multiFetchUrl,
        headers: { "Content-Type": undefined },
        data: data,
        timeout: 5000
      };

      $http(post)
        .success(function(res) {
          let x2js = new X2JS();
          let data = x2js.xml_str2json(res);

          // $scope.results = data["room-stays"]["room-stay"];
          // $scope.xml = res;
          // $scope.json = data;

          return data["room-stays"]["room-stay"];
        })
        .catch(function(err) {
          let x2js = new X2JS();
          let error = x2js.xml_str2json(err);
          $scope.error = `Error. ${err.statusText}`;

          console.log(error);
        });
    };

    let singleFetch = function(req, id) {
      let formatDate = function(date) {
        return moment(date).format("MM/DD/YYYY");
      };

      $scope.url = `${base_url}/api/1.1/properties/${id}/room_availability?check_in=${formatDate(
        req.check_in
      )}&check_out=${formatDate(req.check_out)}&nights=${
        req.nights
      }&cancellation_rules=${req.cancellation_rules}&api_key=${
        auth.api_key
      }&auth_token=${auth.auth_token}&rinfo=${req.rinfo}&transaction_id=${
        req.trans_id
      }`;

      $http
        .get($scope.url)
        .success(function(res) {
          let x2js = new X2JS();
          let data = x2js.xml_str2json(res);

          $scope.single = data["room-stays"]["room-stay"];

          console.log($scope.single);
        })
        .catch(function(err) {
          let x2js = new X2JS();
          let error = x2js.xml_str2json(err);
          $scope.error = `Error. ${err.statusText}`;

          console.log(error);
        });
    };
  });
