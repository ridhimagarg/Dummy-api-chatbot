## Importing libraries
from flask import Flask, Blueprint, request
from flask_restplus import Api, Resource, fields
# import requests
# import json

dic = {'restaurant':['Hotel & salespersons, drivers-all other than restaurant employees- 1549', 'Hotel and restaurant kitchen equipment manufacturing-sheet metal - 1550', 'Hotel-restaurant employees - 1551', 'Hothouse erection-all operations - 1552'],
        'florist': ['Store: florist - 2805', 'Farm-florist - 1190', 'Florist-farm- - 1298', 'Florist-store- - 1299'],
        'air conditioning': ['Air conditioners-portable-installation, service or repair-residential - 33', 'Air conditioning filter media manufacturing-nonwoven - 34', 'Air conditioning parts store -35']}


dic1 = {'12345678942013food': {'Name':'Pizza hut', 'Address': '1900 Colonel Sanders Ln, Louisville, KY', 'Phone': '502-874-8300', 'Website':'www.pizzahut.com', 'Additional Business Operations': 'None'},
        '89543215614760florist': {'Name':'Mandys flowers', 'Address': '216 W. State St. Olean, NY  14760', 'Phone': '(716) 373-2526', 'Website':'www.mandysflowers.com', 'Additional Business Operations': 'None'},
        'mandysflowers14760florist': {'Name':'Mandys flowers', 'Address': '216 W. State St. Olean, NY  14760', 'Phone': '(716) 373-2526', 'Website':'www.mandysflowers.com', 'Additional Business Operations': 'None'}
        
        }

dic2 = {'pizzahutworkerscompensation': ['1234567'],
        'mandysflowersworkerscompensation': ['8976320']
}

dic3 = {'restaurant':['Any seasonal employees?', 'Do employees travel out of state?'],
        'florist': ['Are employee health plans provided', 'Do you lease employees to or from other employers?'],
        }

list_fein =  {}

list_name = {}

##----------------------------------------Initializing the app-------------------------------##

app = Flask(__name__)
# Setting the blueprint i.e, base url : /spectralapis/api
blueprint = Blueprint('api',__name__, url_prefix='/test/api')

## Making final api from restplus
api = Api(blueprint)
app.register_blueprint(blueprint)


##----------------------------- Setting the format for return type for api and crawler ---------------##

## this return format is for google api data
a_api = api.model('apidata', {'BusinessType': fields.List(fields.String('BusinessType'))})
## this return format is for crawler data
b_api = api.model('crawldata', {'Name': fields.String('Name'), 'Phone': fields.String('Phone'), 'Address': fields.String('Address'), 'Website': fields.String('Website'), 'Additional Business Operations' : fields.String('Additional Business Operations')})

c_api = api.model('Quoteavailable', {'Quoteno': fields.String('Quoteno')})

d_api = api.model('Activities', {'Activities': fields.List(fields.String('Activities'))})

e_api = api.model('Data', {'Fein': fields.String('Activities'), 'Name': fields.String('Name')})

##-------------------------- Defining the url and thier functions ----------------------------------##

## This class is redirecting to "localhost:5000//spectralapis/api/business_info/business_name"
@api.route('/business_info/<path:business_type>')
class business_info(Resource):

    ## This marshal will tell the return type and with json key name "api_business_information"
    @api.marshal_with(a_api, envelope='api_business_type')
    def get(self, business_type):

        business_type = business_type.lower()

        if business_type in dic.keys():
            BusinessType = dic[business_type]

        else:
            BusinessType = []


        return {'BusinessType': BusinessType}

        

## This class is redirecting to "localhost:5000//spectralapis/api/business_info/business_name/crawler/website_url"
@api.route('/business_info/fein/<path:fein>/<path:zip>/<path:natureofbusiness>')
class business_info(Resource):

    ## This marshal will tell the return type and with json key name "crawl_business_information"
    @api.marshal_with(b_api, envelope='api_business_information')
    def get(self, fein, zip, natureofbusiness):

        data_in =  fein + zip + natureofbusiness.lower()

        if data_in in dic1.keys():

            Name = dic1[str(data_in)]['Name']
            Phone = dic1[str(data_in)]['Phone']
            Address = dic1[str(data_in)]['Address']
            Website = dic1[str(data_in)]['Website']
            AdditionalBusinessOperations = dic1[str(data_in)]['Additional Business Operations']

        else:
            Name = 'None'
            Phone ='None'
            Address ='None'
            Website = 'None'
            AdditionalBusinessOperations = 'None'

        ## returning data in the form mentioend in b_api
        return {'Name':Name, 'Phone':Phone, 'Address':Address, 'Website': Website, 'Additional Business Operations': AdditionalBusinessOperations }


@api.route('/business_info/quoteno/<path:bussinessname>/<path:lob>')
class business_info(Resource):

    ## This marshal will tell the return type and with json key name "crawl_business_information"
    @api.marshal_with(c_api, envelope='api_quote_information')
    def get(self, bussinessname, lob):

        bussinessname = bussinessname.replace(" ","")

        ##lob = lob.strip()

        data_in =  bussinessname.lower() + lob.lower()

        if data_in in dic2.keys():

            Quoteno = dic2[str(data_in)]

        else:
            Quoteno = ''

        ## returning data in the form mentioend in b_api
        return {'Quoteno': Quoteno}


@api.route('/business_info/activities/<path:business_type>')
class business_info(Resource):

    ## This marshal will tell the return type and with json key name "crawl_business_information"
    @api.marshal_with(d_api, envelope='api_activities_information')
    def get(self, business_type):

        business_type = business_type.replace(" ","")

        data_in = business_type.lower()

        if data_in in dic3.keys():

            activities = dic3[str(data_in)]

        else:
            activities = []

        ## returning data in the form mentioend in b_api
        return {'Activities': activities}


@api.route('/business_info/storedata/<path:id>')
class business_info(Resource):

    @api.marshal_with(e_api, envelope='api_store_data')

    def post(self, id):

        if(request.json['fein']):

            list_fein[id] = request.json['fein']

            return {
                    "Fein": list_fein[id]
                }

        else:

            list_name[id] = request.json['name']

            return {
                    "Name": list_fein[id]
                }  


    def get(self, id):

        name = list_fein[id]

        return {
            ##"status": "Person retrieved",
            "Fein" : list_fein[id]
        }



@app.route('/')
def index():
    return "Deployed"

##-----------------------------------------Main calling ----------------------------------##
if __name__ == '__main__':
    app.run(debug=True)
