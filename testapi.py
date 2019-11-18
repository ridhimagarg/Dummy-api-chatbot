## Importing libraries
from flask import Flask, Blueprint
from flask_restplus import Api, Resource, fields
# import requests
# import json

dic = {'restaurant':['Hotel & salespersons, drivers-all other than restaurant employees- 1549', 'Hotel and restaurant kitchen equipment manufacturing-sheet metal - 1550', 'Hotel-restaurant employees - 1551', 'Hothouse erection-all operations - 1552'],
        'florist': ['Store: florist - 2805', 'Farm-florist - 1190', 'Florist-farm- - 1298', 'Florist-store- - 1299'],
        'air conditioning': ['Air conditioners-portable-installation, service or repair-residential - 33', 'Air conditioning filter media manufacturing-nonwoven - 34', 'Air conditioning parts store -35']}


##----------------------------------------Initializing the app-------------------------------##

app = Flask(__name__)
# Setting the blueprint i.e, base url : /spectralapis/api
blueprint = Blueprint('api',__name__, url_prefix='/test/api')

## Making final api from restplus
api = Api(blueprint)
app.register_blueprint(blueprint)


##----------------------------- Setting the format for return type for api and crawler ---------------##

## this return format is for google api data
a_api = api.model('apidata', {'BusinessType': fields.String('BusinessType')})
## this return format is for crawler data
#b_api = api.model('crawldata', {'Emails': fields.String('Email'), 'Phone numbers': fields.String('Phone number'), 'Addresses': fields.String('Address')})

website = ''


##-------------------------- Defining the url and thier functions ----------------------------------##

## This class is redirecting to "localhost:5000//spectralapis/api/business_info/business_name"
@api.route('/business_info/<path:business_type>')
class business_info(Resource):

    ## This marshal will tell the return type and with json key name "api_business_information"
    @api.marshal_with(a_api, envelope='api_business_information')
    def get(self, business_type):

        business_type = business_type.toLower()

        if business_type in dic.keys():
            BusinessType = dic[business_type]

        else:
            BusinessType = 'Sorry, I can not find a corresponding business type, please re-try with another keyword or class code '


        return {'BusinessType': BusinessType}

        # global website

        # ## Calling the api utitlity for getting information for business name
        # business_information, website = ugaA.get_details(business_type)

        # ## getting name, address, phone number separately
        # name = business_information['Name']
        # formatted_address = business_information['Formatted Address']
        # phone_number = business_information['Phone number']

        # ## Returning ing the form mentioned in a_api
        # return {'Name':name, 'Formatted Address':formatted_address, 'Phone number': phone_number, 'Website': website} 


## This class is redirecting to "localhost:5000//spectralapis/api/business_info/business_name/crawler/website_url"
# @api.route('/business_info/crawler/<path:web>')
# class business_info(Resource):

#     ## This marshal will tell the return type and with json key name "crawl_business_information"
#     @api.marshal_with(b_api, envelope='crawl_business_information')
#     def get(self, web):

#         if 'http' not in web:
#             web = 'http://'+web 
        
#         ## Calling the crawler utitlity for getting information for business name
#         emails, phone_numbers, addresses = uc.get_information(web)

#         ## getting information in the form of list
#         emails = list(set(emails))
#         phone_numbers = list(set(phone_numbers))
#         addresses = list(set(addresses))

#         ## returning data in the form mentioend in b_api
#         return {'Emails':emails, 'Phone numbers':phone_numbers, 'Addresses':addresses}


@app.route('/')
def index():
    return "Deployed"

##-----------------------------------------Main calling ----------------------------------##
# if __name__ == '__main__':
#     app.run(debug=True)
