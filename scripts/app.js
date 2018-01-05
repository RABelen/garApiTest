angular
  .module("MyApp", ["ngMaterial"])
  .factory("transformRequestAsFormPost", function() {
    // I prepare the request data for the form post.
    function transformRequest(data, getHeaders) {
      var headers = getHeaders();
      headers["Content-type"] =
        "application/x-www-form-urlencoded; charset=utf-8";
      return serializeData(data);
    }
    // Return the factory value.
    return transformRequest;
    // ---
    // PRVIATE METHODS.
    // ---
    // I serialize the given Object into a key-value pair string. This
    // method expects an object and will default to the toString() method.
    // --
    // NOTE: This is an atered version of the jQuery.param() method which
    // will serialize a data collection for Form posting.
    // --
    // https://github.com/jquery/jquery/blob/master/src/serialize.js#L45
    function serializeData(data) {
      // If this is not an object, defer to native stringification.
      if (!angular.isObject(data)) {
        return data == null ? "" : data.toString();
      }
      var buffer = [];
      // Serialize each key in the object.
      for (var name in data) {
        if (!data.hasOwnProperty(name)) {
          continue;
        }
        var value = data[name];
        buffer.push(
          encodeURIComponent(name) +
            "=" +
            encodeURIComponent(value == null ? "" : value)
        );
      }
      // Serialize the buffer and clean it up for transportation.
      var source = buffer.join("&").replace(/%20/g, "+");
      return source;
    }
  })
  .controller("MyCtrl", function($scope, $http, transformRequestAsFormPost) {
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

    $scope.multiFetch = function(req) {
      let formatDate = function(date) {
        return moment(date).format("MM/DD/YYYY");
      };

      $scope.results = $scope.message = "";

      $scope.multiFetchUrl = `${
        base_url
      }/api/1.1/room_availability?check_in=${formatDate(
        req.check_in
      )}&check_out=${formatDate(req.check_out)}&cancellation_rules=${
        req.cancellation_rules
      }&api_key=${auth.api_key}&auth_token=${auth.auth_token}&rinfo=${
        req.rinfo
      }&transaction_id=${req.trans_id}`;

      console.log($scope.url);

      let post = {
        method: "POST",
        url: $scope.multiFetchUrl,
        transformRequest: transformRequestAsFormPost,
        data: {
          check_in: formatDate(req.check_in),
          check_out: formatDate(req.check_out),
          cancellation_rules: req.cancellation_rules,
          api_key: auth.api_key,
          auth_token: auth.auth_token,
          rinfo: req.rinfo,
          trans_id: req.trans_id
        }
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

      $scope.results = $scope.message = "";

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

    $scope.xhr = function() {
      var data = new FormData();
      data.append("property_id[]", "b41ce02e-69a3-4a28-8bf8-2ab48d0d4135");
      data.append("property_id[]", "bf7bdcbc-83e5-4fba-b3a9-bc0f97f222f5");
      data.append("property_id[]", "2823e7e0-9f26-4d03-af66-fd1cf5f64f1d");

      var xhr = new XMLHttpRequest();
      xhr.withCredentials = true;

      xhr.addEventListener("readystatechange", function() {
        if (this.readyState === 4) {
          console.log(this.responseText);
        }
      });

      xhr.open(
        "POST",
        "https://availability.integration2.testaroom.com/api/1.1/room_availability?rinfo=%5B%5B18%2C18%5D%5D&check_in=6%2F15%2F2018&check_out=6%2F17%2F2018&transaction_id=1234&api_key=095f6d98-36cc-5975-a67a-95c48b87187d&auth_token=92623a90-6c52-5cbf-88c2-f061fd003028"
      );
      xhr.setRequestHeader("cache-control", "no-cache");

      xhr.send(data);
    };
  });
