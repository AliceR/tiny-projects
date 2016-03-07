import pandas as pd

# read data from csv
data = pd.read_csv("trip_data_1.csv",
                   # a delimiter to parse just the first nrows (used for tests)
                   #nrows = 200,
                   parse_dates = [5, 6],
                   encoding = "utf-8"
                   )

# delete unnecessary columns
data.drop(labels=["medallion", "hack_license", "vendor_id", "rate_code", "store_and_fwd_flag"], axis = 1, inplace = True)

#delete all columns where there are no coordinates for lat, lng
data.fillna({"pickup_longitude":0, "pickup_latitude":0, "dropoff_longitude":0, "dropoff_latitude":0}, inplace=True)

def checkCoord(coord):
    return (~((coord > -1) & (coord<1)))

data = data[(checkCoord(data["pickup_longitude"])) & (checkCoord(data["pickup_latitude"])) & (checkCoord(data["dropoff_longitude"])) & (checkCoord(data["dropoff_latitude"])) ]
# select only a certain date (13.01.2016)
data = data[((data['dropoff_datetime'] > pd.Timestamp('20130112')) & (data['dropoff_datetime'] < pd.Timestamp('20130113'))) & ((data['pickup_datetime'] > pd.Timestamp('20130112')) & (data['pickup_datetime'] < pd.Timestamp('20130113')))]
data.sort_values(by=["pickup_longitude"], inplace = True)
data = data.sample(n=2000)
data.to_csv("taxi_trip_12_01_2013.csv", encoding="utf-8")