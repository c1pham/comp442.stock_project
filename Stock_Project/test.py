import sys
from yahoo_fin.stock_info import get_live_price


if __name__=="__main__":
	log = []
	st = sys.argv[1]
	st_list = st.split(',')
	for i in st_list:
		log.append(get_live_price(i))
	print(log)
	#print(st);
	#sys.stdout.flush()
