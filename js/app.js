
var app = angular.module('groceryListApp', ["ngRoute"]);

app.config(function ($routeProvider) {
	$routeProvider

		.when("/", {
			templateUrl: "views/groceryList.html",
			controller: "HomeController"
		})
		.when("/addItem", {
			templateUrl: "views/addItem.html",
			controller: "GroceryListItemsController"
		})
		.when("/addItem/edit/:id", {
			templateUrl: "views/addItem.html",
			controller: "GroceryListItemsController"
		})
		.otherwise({
			redirectTo: "/"
		});
});

app.service("GroceryService", function ($http) {
	var groceryService = {};
	groceryService.groceryItems = [];

	//connect to the server using ajax and retrieve data from json file
	$http.get("data/server_data.json")
		.success(function (data) {
			groceryService.groceryItems = data;

			for (var item in groceryService.groceryItems) {
				groceryService.groceryItems[item].data = new Date(groceryService.groceryItems[item].date);
			}
		})
		.error(function (data, status) {
			alert("Things went wrong !");
		});

	//findby id to edit
	groceryService.findById = function (id) {
		for (var item in groceryService.groceryItems) {
			if (groceryService.groceryItems[item].id == id)
				return groceryService.groceryItems[item];
		}
	};


	//server is going to generate a new id for us
	//function for greating a new id to the maximum grocerylist id and add 1
	groceryService.getNewId = function () {
		if (groceryService.newid) {
			groceryService.newid++;
			return groceryService.newid;
		}
		else {
			var maxId = _.max(groceryService.groceryItems, function (entry) { return entry.id; })
			groceryService.newid = maxId.id + 1;
			return groceryService.newid;
		}
	};
	//mark checked or unchecked completed function
	groceryService.markCompleted = function (entry) {
		entry.completed = !entry.completed;
	};


	//Deleting an item
	groceryService.removeItem = function (entry) {
		//send an id of an item you g=want to delete to the server and server return the status
		$http.post("data/delete_item.json", { id: entry.id })
			.success(function (data) {
				if (data.status == 1) {
					var index = groceryService.groceryItems.indexOf(entry);
					groceryService.groceryItems.splice(index, 1);
				}
			})
			.error(function (data, status) {

			});
	
	}
	//function for adding a new item
	groceryService.save = function (entry) {

		var updateItem = groceryService.findById(entry.id);

		if (updateItem) {
			//for updating items at the server side
			$http.post("data/updated_item.json", entry)
				.success(function (data) {
					if (data.status == 1) {
						updateItem.completed = entry.completed;
						updateItem.itemName = entry.itemName;
						updateItem.date = entry.date;
					}
				})
				.error(function (data, status) {

				});

		
		} else {
			//pass the status and the data that we creating(entry)
			$http.post("data/added_item.json", entry)
				.success(function (data) {
					entry.id = data.newid;
				})
				.error(function (entry, status) {

				})
			//for the client side Id creation
			//entry.id = groceryService.getNewId();
			groceryService.groceryItems.push(entry);
		}
	};
	return groceryService;
});


app.controller("HomeController", ["$scope", "GroceryService", function ($scope, GroceryService) {
	$scope.appTitle = "Grocery List";
	$scope.groceryItems = GroceryService.groceryItems;

	$scope.removeItem = function (entry) {
		GroceryService.removeItem(entry);
	};

	$scope.markCompleted = function (entry) {
		GroceryService.markCompleted(entry);
	};

	//watch and load our grocerylist items and update from the server
	$scope.$watch(function () {
		return GroceryService.groceryItems;
	}, function (groceryItems) {
			$scope.groceryItems = groceryItems;
		})

}]);

app.controller("GroceryListItemsController", ["$scope", "$routeParams","$location", "GroceryService", function ($scope, $routeParams,$location, GroceryService) {

	if (!$routeParams.id) {
		$scope.groceryItem = { id: 0, completed: false, itemName: "", date: new Date() };
	} else {
		$scope.groceryItem = _.clone(GroceryService.findById(parseInt($routeParams.id)));
	}


	$scope.rp = "Route Parameter value : " + $routeParams.id;

	$scope.save = function () {
		GroceryService.save($scope.groceryItem);
		$location.path("/");
	}
	//debug ourlist
	console.log($scope.groceryItems);
}]);

//creating a custom directive for our groceryItem view
app.directive("tbGroceryItem", function () {
	return {
		restrict: "E",
		templateUrl: "views/groceryItem.html"
	}
});