angular
  .module("MyApp", ["ngMaterial"])
  .controller("MyCtrl", function($scope, $http) {
    const base_url = "https://availability.integration2.testaroom.com";
    let today = new Date();
    let tom = new Date();

    tom.setDate(tom.getDate() + 1);

    let auth = {
      api_key: "095f6d98-36cc-5975-a67a-95c48b87187d",
      auth_token: "92623a90-6c52-5cbf-88c2-f061fd003028"
    };

    $scope.params = {
      prop_id: "d4b5bc60-1c9c-4e10-b8bd-cc6f6a1a08a8",
      check_in: today,
      check_out: tom,
      nights: "",
      cancellation_rules: 1,
      rinfo: [[18, 18]],
      trans_id: "67f6d937"
    };

    $scope.listProperties = function() {
        $scope.propUrl = `https://book.integration2.testaroom.com/api/properties.csv?api_key=${auth.api_key}&auth_token=${auth.auth_token}`
    
        // $http
        // .get($scope.propUrl)
        // .map(function(res) {
        //   let x2js = new X2JS();
        //   let data = x2js.xml_str2json(res);

        //   console.log(res);
        // })
        // .catch(function(err) {
        //   let x2js = new X2JS();
        //   let error = x2js.xml_str2json(err);
        //   $scope.error = `Error. ${err.statusText}`;

        //   console.log(error);
        // });

        // let response = fetch($scope.propUrl).then(function(res) {
        //   let x2js = new X2JS();
        //   let data = x2js.xml_str2json(res);

        //   return res;
        //   console.log(res);
        // });

        // let stream = Rx.Observable.fromPromise(response)
        //   .map(function(data) {
        //     console.log(data);
        //   })

        Papa.parse("/assets/sample.csv", {
          download: true,
          complete: function(results) {
            $scope.results = results.data;
            $scope.fields = results.meta.fields;
            $scope.$apply();

            console.log($scope.results);
          }
        });
    }

    $scope.multiFetch = function(req) {
      let data = new FormData();
      data.append("property_id[]", "b41ce02e-69a3-4a28-8bf8-2ab48d0d4135");
      data.append("property_id[]", "bf7bdcbc-83e5-4fba-b3a9-bc0f97f222f5");
      data.append("property_id[]", "2823e7e0-9f26-4d03-af66-fd1cf5f64f1d");
     
      let formatDate = function(date) {
        return moment(date).format("MM/DD/YYYY");
      };

      $scope.results = "";

      $scope.multiFetchUrl = `${
        base_url
      }/api/1.1/room_availability?check_in=${formatDate(
        req.check_in
      )}&check_out=${formatDate(req.check_out)}&cancellation_rules=${
        req.cancellation_rules
      }&api_key=${auth.api_key}&auth_token=${auth.auth_token}&rinfo=${
        req.rinfo
      }&transaction_id=${req.trans_id}`;

      console.log(data);

      let post = {
        method: "POST",
        url: $scope.multiFetchUrl,
        headers: { "Content-Type": undefined },
        data: data
      };

      $http(post)
        .success(function(res) {
          let x2js = new X2JS();
          let data = x2js.xml_str2json(res);

          $scope.results = data["room-stays"]["room-stay"];
          $scope.xml = res;
          $scope.json = data;

          console.log(res);
        })
        .catch(function(err) {
          let x2js = new X2JS();
          let error = x2js.xml_str2json(err);
          $scope.error = `Error. ${err.statusText}`;

          console.log(error);
        });
    };

    $scope.singleFetch = function(req) {
      let formatDate = function(date) {
        return moment(date).format("MM/DD/YYYY");
      };

      $scope.results = "";

      $scope.url = `${base_url}/api/1.1/properties/${
        req.prop_id
      }/room_availability?check_in=${formatDate(
        req.check_in
      )}&check_out=${formatDate(req.check_out)}&nights=${
        req.nights
      }&cancellation_rules=${req.cancellation_rules}&api_key=${
        auth.api_key
      }&auth_token=${auth.auth_token}&rinfo=${req.rinfo}&transaction_id=${
        req.trans_id
      }`;

      console.log($scope.url);

      $http
        .get($scope.url)
        .success(function(res) {
          let x2js = new X2JS();
          let data = x2js.xml_str2json(res);

          $scope.results = data["room-stays"]["room-stay"];
          $scope.xml = res;
          $scope.json = data;

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
