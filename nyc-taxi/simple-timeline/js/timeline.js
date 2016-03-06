(function(){

	function T(selector, timeExt, values){
		this.div = d3.select(selector);
		this.timeExt = timeExt;
		this.values = values;
		this.renderSVG();
	}

	T.prototype.renderSVG = function() {
		var w = parseInt(this.div.style("width").replace("px", ""));
		var h = 100;
		var pad = 20;
		var container = this.div.append("svg").style("width", w).style("height", h);
		this._container = container;

		//the horizontal axis
		//create timescale
		var timeScale = d3.time.scale();
			timeScale.domain(this.timeExt);
			timeScale.range([pad,w-pad]);
		this._timeScale = timeScale;

		//create timeaxis and set the attributes
		var timeAxis = d3.svg.axis()
			.scale(timeScale)
			.ticks(d3.time.hour, 1)
			.tickFormat(d3.time.format('%H'));
		
		//append the timeaxis to the container
		container.append("g")
			.attr("class", "timeaxis")
			.attr("transform", "translate(0,80)")
			.call(timeAxis);

		//the vertical axis
		//create ridescale
		var rideScale = d3.scale.linear();
		rideScale.domain([Math.min.apply(null,this.values), Math.max.apply(null,this.values)]);
		rideScale.range([80,0]);

		//create rideAxis
		var rideAxis = d3.svg.axis()
			.scale(rideScale)
			.orient("left")
			.ticks(5);

		//append the rideAxis verticall to the container
		container.append("g")
			.attr("class", "rideaxis")
			.attr("transform", "translate(" + pad + ",0)")
			.call(rideAxis);

		//add the values to the plot
		var bars = container.append("g").attr("class", "bars");
		var timeExt = this.timeExt;
		var timeScale = this._timeScale;
		bars.selectAll("rect")
			.data(this.values)
			.enter()
			.append("rect")
			.attr("x", function(d,i){return timeScale(timeExt[0].getTime() + i*3600000)})
			.attr("y", function(d){return 80-rideScale(d)})
			.attr("width", (w-2*pad)/24)
			.attr("height", function(d){return rideScale(d)})
	}	

	T.prototype.startAnimation = function(callback){
		this._interval = window.setInterval(nextMinute.bind(this), 100);
		var line = this._container.append("rect").attr("x", 500).attr("y", 0).attr("width", 1).attr("height",80);
		function nextMinute(){
			var currentTime = new Date(this._timeScale.invert(line.attr("x")).getTime() + 60000);
			line.attr("x", this._timeScale(currentTime));
			callback(currentTime);
			if ((currentTime.getHours() == this.timeExt[1].getHours()) && (currentTime.getMinutes() == this.timeExt[1].getMinutes())){
				this.stopAnimation();
			}
		}
	}

	T.prototype.stopAnimation = function(){
		window.clearInterval(this._interval);
	}
	window.T = T;
})();