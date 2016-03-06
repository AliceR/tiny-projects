window.onload = function(){
	//here is where you create the timeline
	var random = [];
	for (var i = 0; i < 24; i++) {
		random[i] = Math.round(Math.random()*100);
	};
	var timeline = new T(".timeline", [new Date("2016-01-02 00:00"),new Date("2016-01-02 24:00")], random);
	timeline.startAnimation(writeDate);
	function writeDate(date){
		console.log(date);
	}
}