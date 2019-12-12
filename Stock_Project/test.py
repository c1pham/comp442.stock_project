import sys
from WorldTradingData import WorldTradingData as wtd

if __name__=="__main__":
	#retrieve token from world trading data
	token = wtd("oNMltusmco1j86HEtjeabrsabdOGwYRWOKpq0zIKisnPFTKhNa0jJQ1WjvGv")

	#retrive all the stocks from the app.js
	st = sys.argv[1]

	#turn the inputs into an array strings
	st_list = st.split(',')

	#initalize arrays
	price_holder = []
	temp = []

	#loop over each stock to get current price and push them into price_holder
	for i in st_list:
		#search real life stock price
		temp = token.stock_search(i);
		temp = temp['data']

		#push the current price into price_holder
		price_holder.append(temp[0]['price'])
		
	#return list of current price to the app.js through print command
	print(price_holder)
