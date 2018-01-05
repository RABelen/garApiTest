angular
  .module("MyApp", ["ngMaterial"])
  .controller("MyCtrl", function($scope, $http) {
    const base_url = "https://availability.integration2.testaroom.com";

    let auth = {
      api_key: "095f6d98-36cc-5975-a67a-95c48b87187d",
      auth_token: "92623a90-6c52-5cbf-88c2-f061fd003028"
    };

    $scope.params = {
      prop_id: "d4b5bc60-1c9c-4e10-b8bd-cc6f6a1a08a8",
      check_in: new Date(),
      check_out: new Date(),
      nights: "",
      cancellation_rules: 1,
      rinfo: [[18, 18]],
      trans_id: "67f6d937"
    };

    $scope.fetch = function(req) {
      let formatDate = function(date) {
        return moment(date).format("MM/DD/YYYY");
      }
     
      $scope.results = $scope.message = "";
      
      $scope.url = `${base_url}/api/1.1/properties/${req.prop_id}/room_availability?check_in=${formatDate(req.check_in)}&check_out=${formatDate(req.check_out)}&nights=${req.nights}&cancellation_rules=${req.cancellation_rules}&api_key=${auth.api_key}&auth_token=${auth.auth_token}&rinfo=${req.rinfo}&transaction_id=${req.trans_id}`;

      $http
        .get($scope.url)
        .success(function(res) {
          let x2js = new X2JS();
          let data = x2js.xml_str2json(res);

          $scope.json = data["room-stays"];
          $scope.xml = res;

          $scope.results = {
            request: data["room-stays"].request,
            status: data["room-stays"].status,
            roomStay: data["room-stays"]["room-stay"]
            // displayPricing: data["room-stays"]["room-stay"]["display-pricing"],
            // lineItems:
            //   data["room-stays"]["room-stay"]["display-pricing"]["line-items"]
          };

          console.log($scope.results);
        })
        .catch(function(err) {
          let x2js = new X2JS();
          let error = x2js.xml_str2json(err);
          $scope.error = `Error. ${err.statusText}`;

          console.log(error);
        });
    };
  });
