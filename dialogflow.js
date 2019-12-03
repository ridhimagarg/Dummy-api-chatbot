// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';

// setting up dialogflow agent
const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');

// Using some external libraries
//axios for using third party api hosted as http.
const axios = require('axios');
// xml2js for parsing xml output in response
const xml2js = require('xml2js');

// Accessing firebase admin
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

const db = admin.firestore();
db.settings({ timestampsInSnapshots: true });
// Create firestore database and access it using collection and doc
const dialogflowAgentRef = db.collection('users').doc('agent');


// Variables for global use
/**var claim = 100;
var claims_num_iter = 0;
var buss_type = 100;
var buss_type_num_iter = 0;
let dnum_location =0;
let seclocbuss_type =0;**/

// for fallback intent
let fallbackcount = 0;



 
process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements
 
exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
  
  // Function for welcome intent
    function welcome(agent){

        let date = new Date();

        var curHr = date.getHours();
        //agent.add(agent.getTimeZone().toString());
        //agent.add(curHr.toString());
        
        if(curHr.toString() < 12){
            agent.add('Hello, Good Morning!');
        }
        else{
            agent.add('Hello, Hope you are having good day!');
        }
        agent.add('I am Alice, your insurance virtual assistant.');
        agent.add('How can I help you today? Here are some options you can select:');
        agent.add(new Suggestion('Request a new quote'));
        agent.add(new Suggestion('Complete an existing quote'));
        agent.add(new Suggestion('Lookup a policy or insured'));
        agent.add(new Suggestion('Bind a completed quote'));
        agent.add(new Suggestion('Issue a bound quote'));
        agent.add(new Suggestion('Change or Cancel a Policy'));
        agent.add(new Suggestion('Check the status of a work item'));
        agent.add(new Suggestion('Make a Payment '));
  }

 
  // Function for fallback intent. 
    function fallback(agent){
    	
        fallbackcount++;
        
        if(fallbackcount ==1){
            agent.add('Sorry can you say that again');
        }
        else if (fallbackcount === 2){
            return agent.add('Sorry, I didnt get it. Please refrase');  
        } 
        else{
        // If 'fallbackCount' is greater than 2, send out the final message and terminate the conversation.
            return agent.add('I am not able to get you. Let try some other time');
        }
    }

  
    function fein(agent){

        const fein = agent.parameters.fein;
        const name = agent.parameters['business-name'];
        
        
        if (fein != ''){  

        const gotfein = fein.toString().length >0;
        const feinlength = fein.toString().length.toString();
            
            if (fein.toString().length !=9){

                agent.add('Please enter valid 9 digit fein number');
                agent.context.set({
                'name':'fein-followup',
                'lifespan': 0
                });
                
            }
        
            else{
            
            if(isNaN(fein)){

                agent.add('Please enter integer');
                agent.context.set({
                'name':'newquote-followup'
                });
            }
            
            else{
            
                agent.add('What is the nature of your Business ?');
                

                /**return db.runTransaction(t => {
                t.set(dialogflowAgentRef, {fein: fein});
                return Promise.resolve('Write complete');
                }).then(doc => {
                console.log("Written fein");
                agent.add("Wrote fein to the Firestore database.");
                }).catch(err => {
                console.log("Error writing to Firestore: ${err}");
                agent.add("Failed to write fein to the Firestore database.");
                });**/
            }
        }
        }
        else{
            agent.add('What is the nature of your Business ?');
        }
  
  }
  
  
    function zip(agent){
      
    const zip = agent.parameters.zip;
    		agent.add(zip.toString());
    
    		if(zip.toString().length == 5 || zip.toString().length == 7){
              
              	const parameters = agent.context.get('newquote-followup');
              
              	const business_nature = parameters.parameters['business-nature'];
              
                var fein1 = parameters.parameters['fein'];
                  
                if(fein1 == ""){
                	fein1 = " "
                }
              
              	agent.add('http://calm-peak-72227.herokuapp.com/test/api/business_info/fein/'+fein1+'/'+zip+'/'+business_nature);
              
              	return axios.get('http://calm-peak-72227.herokuapp.com/test/api/business_info/fein/'+fein1+'/'+zip+'/'+business_nature)
              	.then((result) => {
                	console.log(result.data);	
                  	agent.add('Give me a moment while I lookup this prospective insured for you.');
                    agent.add('Here is what I found:');
                   	agent.add('Name: '+ result.data.api_business_information.Name);
                    agent.add('Address: '+ result.data.api_business_information.Address );
                    agent.add('Phone: '+ result.data.api_business_information.Phone);
                    agent.add('Website: '+ result.data.api_business_information.Website);
                    agent.add('Additional Business Operations: '+ result.data.api_business_information['Additional Business Operations']);
                    agent.add('Please take a moment to review and confirm the details');
                    agent.add(new Suggestion('Confirm'));
                    agent.add(new Suggestion('Edit'));
                  	
                  	/**return db.runTransaction(s => {
                        s.update(dialogflowAgentRef, {business_name: result.data.api_business_information.Name});
                                    return Promise.resolve('Write complete');
                                    }).then(doc => {
                        console.log("Written name");
                        agent.add("Wrote name to the Firestore database.");
                        }).catch(err => {
                            console.log("Error writing to Firestore: ${err}");
                            agent.add("Failed to write name to the Firestore database.");
                        });**/
                    });
            
            }
    
    		else{
              
              	agent.add('Please enter valid 5 or 7 digit zip code');
              	agent.context.set({
              		'name':'businessna-followup'
              });
            
            }
    
    }

  
    function businessna(agent){
  				
  			const business_nature =  agent.parameters['business-nature'];
      		if(["hi","hello","heya","hey there"].indexOf(business_nature.toLowerCase()) > -1){
                  
                agent.add('I am Alice, your insurance virtual assistant.');
                agent.add('How can I help you today? Here are some options you can select:');
                agent.add(new Suggestion('Request a new quote'));
                agent.add(new Suggestion('Complete an existing quote'));
                agent.add(new Suggestion('Lookup a policy or insured'));
                agent.add(new Suggestion('Bind a completed quote'));
                agent.add(new Suggestion('Issue a bound quote'));
                agent.add(new Suggestion('Change or Cancel a Policy'));
                agent.add(new Suggestion('Check the status of a work item'));
                agent.add(new Suggestion('Make a Payment ')); 
                const allcontexts = agent.contexts;
                agent.add(allcontexts[0].name.toString());
                var i;  
                for(i=0; i< allcontexts.length; i++ ){  
                    if(allcontexts[i].name.toString() != 'defaultwelcomeintent-followup'){
                        agent.context.set({
                                'name':allcontexts[i].name.toString(),
                                'lifespan':0
                        });
                    }  
                }
            
     
            }
      
    		else{
    		agent.add("Please enter Primary Location's Zip Code");
            }    
    }


    function insurance_line(agent){

  		agent.add('OK. Thanks. Select an Insurance Line to start your Quote. Here are your options:');
    	agent.add(new Suggestion('Workers Compensation'));
    	agent.add(new Suggestion('Commercial Auto'));
    	agent.add(new Suggestion('Commercial Property'));
   
    }
  
  
    function nq(agent){
    
    return dialogflowAgentRef.get()
      .then(doc => {

        if (!doc.exists){
          agent.add('No data found in the database!');
        }

        else{
          agent.add(doc.data().business_name.toString());
          const business_name = doc.data().business_name;
          return axios.get('http://calm-peak-72227.herokuapp.com/test/api/business_info/quoteno/'+business_name+'/workerscompensation')
              .then((result) => {
              console.log(result.data);
      		    if(result.data.api_quote_information.Quoteno !=''){
                    agent.add('Okay. I have found an existing Workers Comp Quote for <Business Name>.');
                    agent.add('Do you still want to continue?');
                    agent.add(new Suggestion('Yes'));
                    agent.add(new Suggestion('No'));
                }
      		else{
            	agent.add("Great. I'd require some business information to get you the best quote.");
              	agent.add("Please enter keyword or class code that best describes the primary business for e.g. Florist, Clerical, Pizza Restaurant, Dry Cleaner.");
            
            }
        });
        }

        return Promise.resolve('Read complete');
      }).catch(() => {
        agent.add('Error reading Business Name from the Firestore database.');
        agent.add("Anyways. I'd require some business information to get you the best quote.");
        agent.add("Please enter keyword or class code that best describes the primary business for e.g. Florist, Clerical, Pizza Restaurant, Dry Cleaner.");
      });
  
    }

  
    function nqno(agent){
  	
        agent.add('Is there anything else I can help you with?');
        agent.add(new Suggestion('Request a new quote'));
        agent.add(new Suggestion('Complete an existing quote'));
        agent.add(new Suggestion('Lookup a policy or insured'));
        agent.add(new Suggestion('Bind a completed quote'));
        agent.add(new Suggestion('Issue a bound quote'));
        agent.add(new Suggestion('Change or Cancel a Policy'));
        agent.add(new Suggestion('Check the status of a work item'));
        agent.add(new Suggestion('Make a Payment '));
    
    }
  
  
  
    function classc(agent){
    
    	const classc = agent.parameters['class-code']; 
    	const classcn = agent.parameters['class-code-n'];
  		agent.add(classc.toString());
    
    	return axios.get('http://calm-peak-72227.herokuapp.com/test/api/business_info/'+classc.toString())
              .then((result) => {
                console.log(result.data);
           	    if(result.data.api_business_type.BusinessType.length >0){

                    agent.add('Great! Here is what I found:');
                    agent.add('Select the right business type:');
           	        var j;
           	        for(j=0; j< result.data.api_business_type.BusinessType.length; j++)
                       agent.add(new Suggestion(result.data.api_business_type.BusinessType[j]));
                }

           		else{
                    agent.add('Sorry, I cannot find a business type that matches your entry, please re-try with another keyword or class code ');
        	        agent.context.set({
                        'name':'nq-followup'
                    });
                }
           
              });
              
    	
    	/**if (classc.toString().toLowerCase() == 'restaurant' || classcn.toString().toLowerCase() == '9082' ){
          	agent.add('Alright. Here is what I found: ');
        	//agent.add('Restaurant - 9082');
          	
          	agent.add(new Suggestion('Traditional Restaurant - 9082'));
          	agent.add(new Suggestion('Fast Food Restaurant - 9083'));
          	agent.add(new Suggestion('Alcohol Restaurant - 9084'));
          	agent.add('Select the right business type');
          	
        }
    
    	else if (classc.toString().toLowerCase() == 'florist' || classcn.toString().toLowerCase() == '8001' ){
          	agent.add('Alright. Here is what I found: ');
        	//agent.add('Florist - 8001');
          	
          	agent.add(new Suggestion('Restaurant - 9082'));
          	agent.add(new Suggestion('Florist - 8001'));
          	agent.add('Select the right business type');
          	
        
        }
    	else{
        	agent.add('Sorry, I cannot find a business type that matches your entry, please re-try with another keyword or class code ');
        	agent.context.set({
              'name':'nq-followup'
              });
        }**/
  
    }

  
    function numemp(agent){

        const num_employees = agent.parameters['num-employees'];
        agent.add('Tell me when did you start your business in mm/dd/yyyy?');
  		
    }

  
    function startdate(agent){
  		
        const startdate = agent.parameters['start-date'];

        let start_date = new Date(startdate.toString());

        let date = new Date();

        let ystart = start_date.getFullYear();

        let ydate = date.getFullYear();

        if(ydate-ystart !=0){

            agent.add('Your business is appxoimately since '+ (ydate-ystart) +' years');
        }

        else{
        
            agent.add('Your business is from few months');
        }
        
        agent.add('OK. What is the total estimated annual payroll for your business? ');
  
    }

  
    function payroll(agent){
  
        agent.add('Thanks, We are almost done');
        agent.add('Let me know if your business is located in any of these state(s) : NY, WI');
        agent.add(new Suggestion('Yes'));
        agent.add(new Suggestion('No'));
    
    }

  
    function stateno(agent){

        var i;
        agent.add('Is your business involved in these operations/activities? ');
        return axios.get('http://calm-peak-72227.herokuapp.com/test/api/business_info/activities/Restaurant')
                .then((result) => {
                console.log(result.data);
                    for(i=0; i< result.data.api_activities_information.Activities.length; i++)
                    agent.add(new Suggestion(result.data.api_activities_information.Activities[i]));
  				agent.add(new Suggestion('None'));
        });
  
    }

  
    function activitiesno(agent){

        agent.add('Thank you for your response. The estimated  annual premium would range from  "$2000" to "$3000". ');
        agent.add('This fast quote has been emailed to the email registered with your user profile. Please keep Indication ID# NICI001003 for your future reference.');
        agent.add('Do you want to contiue with this quote and see if we can issue a policy for you?');
        agent.add(new Suggestion('Yes, continue with me'));
        agent.add(new Suggestion('Yes, continue on the AQ website'));
        agent.add(new Suggestion('No')); 


    }
  
 
  
 /**function editnano(agent){
  		agent.add('OK. Thanks. Select an Insurance Line to start your Quote. Here are your options:');
    	agent.add(new Suggestion('Workers Compensation'));
    	agent.add(new Suggestion('Commercial Auto'));
    	agent.add(new Suggestion('Commercial Property'));

   
  }
  
  **/
    function editna(agent){

        agent.add('Ok, I have updated name.  Do you want to edit Address?');
        agent.add(new Suggestion('Yes'));
        agent.add(new Suggestion('No')); 
    
    }
  
  
    function editadd(agent){

  		agent.add('Ok, I have updated your address');
		agent.add('Do you want to edit Phone number?');
    	agent.add(new Suggestion('Yes'));
    	agent.add(new Suggestion('No')); 
    	
    	
    }

  
    function editaddno(agent){

  		agent.add('Okay, do you want to edit Phone number?');
    	agent.add(new Suggestion('Yes'));
    	agent.add(new Suggestion('No')); 
  
    }

  
    function editph(agent){
    
    	agent.add('Ok, I have updated your phone number');
  		agent.add('OK, Do you want to edit website?');
    	agent.add(new Suggestion('Yes'));
    	agent.add(new Suggestion('No')); 
  
    }
  
    
    function editphnno(agent){

  		agent.add('OK, Do you want to edit website?');
    	agent.add(new Suggestion('Yes'));
    	agent.add(new Suggestion('No')); 
    
    }

  
    function editwe(agent){

  		agent.add('Ok, I have updated your website');
    	agent.add('Do you want to edit additional business operations');
    	agent.add(new Suggestion('Yes'));
    	agent.add(new Suggestion('No')); 
    	
    }
  

    function editweno(agent){
  
  		agent.add('Do you want to edit additional business operations');
    	agent.add(new Suggestion('Yes'));
    	agent.add(new Suggestion('No')); 
  
    }

  
    function editbono(agent){
  
  		agent.add('OK. Thanks. Select an Insurance Line to start your Quote. Here are your options:');
    	agent.add(new Suggestion('Workers Compensation'));
    	agent.add(new Suggestion('Commercial Auto'));
        agent.add(new Suggestion('Commercial Property'));

    }

  
    function editbo(agent){
  		
    	agent.add('Ok, I have updated your business operations');
    	agent.add('OK. Thanks. Select an Insurance Line to start your Quote. Here are your options:');
    	agent.add(new Suggestion('Workers Compensation'));
    	agent.add(new Suggestion('Commercial Auto'));
    	agent.add(new Suggestion('Commercial Property'));
  
    }


    function quoteno(agent){
  
        agent.add('Is there anything else I can help you with?');
        agent.add(new Suggestion('Request a new quote'));
        agent.add(new Suggestion('Complete an existing quote'));
        agent.add(new Suggestion('Lookup a policy or insured'));
        agent.add(new Suggestion('Bind a completed quote'));
        agent.add(new Suggestion('Issue a bound quote'));
        agent.add(new Suggestion('Change or Cancel a Policy'));
        agent.add(new Suggestion('Check the status of a work item'));
        agent.add(new Suggestion('Make a Payment '));
  
    }

  
    function meyes(agent){

        agent.add('Great! Let’s learn more about your business so that we can price your policy accurately.');
        agent.add('Please take a moment to confirm the business details below:');
        agent.add('Insured Name: Pizza hut');
        agent.add('Primary Address: <Street Address, State, City, Zip code>');
        agent.add('FEIN: <FEIN>');
        agent.add('NCCI Risk ID: <NCCI Risk ID>');
        agent.add('Website: <Website>');
        agent.add(new Suggestion('Confirm'));
        agent.add(new Suggestion('Edit'));
	    
    }


    function bussedit(agent){

        agent.add('Do you want to edit insured name?');
        agent.add(new Suggestion('Yes'));
        agent.add(new Suggestion('No'));
    
    }

  
    function busseditna(agent){

        agent.add('Ok, I have updated name'); 
        agent.add('Do you want to edit address?');
        agent.add(new Suggestion('Yes'));
        agent.add(new Suggestion('No'));
  
    }

  
    function busseditnano(agent){

        agent.add('Do you want to edit address?');
        agent.add(new Suggestion('Yes'));
        agent.add(new Suggestion('No'));
  
    }

  
    function busseditadd(agent){

        agent.add('Ok, I have updated address'); 
        agent.add('Do you want to edit fein?');
        agent.add(new Suggestion('Yes'));
        agent.add(new Suggestion('No'));
  
    }

  
    function busseditaddno(agent){

        agent.add('Do you want to edit fein?');
        agent.add(new Suggestion('Yes'));
        agent.add(new Suggestion('No'));
  
    }

  
    function busseditfein(agent){

        agent.add('Ok, I have updated FEIN number');
        agent.add('Do you want to edit NCCI Risk Id?');
        agent.add(new Suggestion('Yes'));
        agent.add(new Suggestion('No'));

    }

  
    function busseditfeinno(agent){

        agent.add('Do you want to edit NCCI Risk Id?');
        agent.add(new Suggestion('Yes'));
        agent.add(new Suggestion('No'));

    }

  
    function busseditncci(agent){

        agent.add('Ok, I have updated NCCI risk id');
        agent.add('Do you want to edit Website?');
        agent.add(new Suggestion('Yes'));
        agent.add(new Suggestion('No'));
  
    }

  
    function busseditnccino(agent){

        agent.add('Do you want to edit Website?');
        agent.add(new Suggestion('Yes'));
        agent.add(new Suggestion('No'));
  
    }

  
    function busseditwebsite(agent){

        agent.add('Ok, I have updated website');
        agent.add('Will you like to provide a DBA Name (Doing a Business)?');
        agent.add(new Suggestion('Yes'));
        agent.add(new Suggestion('No'));

    }

  
    function busseditwebsiteno(agent){
  
        agent.add('Will you like to provide a DBA Name (Doing a Business)?');
        agent.add(new Suggestion('Yes'));
        agent.add(new Suggestion('No'));
    
    }
  

    function dba(agent){

        agent.add('Will you like to provide a DBA Name (Doing a Business)?');
        agent.add(new Suggestion('Yes'));
        agent.add(new Suggestion('No'));
    
    }

  
    function email(agent){
  
        agent.add('Thanks. Would you like to provide  office or mobile contact phone number?');
        agent.add(new Suggestion('Office'));
        agent.add(new Suggestion('Mobile'));
        agent.add(new Suggestion('Both'));
  
    }

  
    function phonenomobile(agent){
    

        const phone = agent.parameters['mobile-phone-number'];

    	agent.add('Please select your Business registration type?');
      	agent.add(new Suggestion('Corporation'));
      	agent.add(new Suggestion('Joint Venture'));
      	agent.add(new Suggestion('LLC'));
      	agent.add(new Suggestion('Not for Profit Org'));
      	agent.add(new Suggestion('Partnership'));
      	agent.add(new Suggestion('S corporation'));
      	agent.add(new Suggestion('Trust'));
      	agent.add(new Suggestion('Other'));
    
    	agent.context.set({
              'name':'phoneno-office-followup'
              });

    }
  
    function phonenooffice(agent){
    

        const phone = agent.parameters['office-phone-number'];
    	agent.add('Please select your Business registration type?');
 
      	agent.add(new Suggestion('Corporation'));
      	agent.add(new Suggestion('Joint Venture'));
      	agent.add(new Suggestion('LLC'));
      	agent.add(new Suggestion('Not for Profit Org'));
      	agent.add(new Suggestion('Partnership'));
      	agent.add(new Suggestion('S corporation'));
      	agent.add(new Suggestion('Trust'));
      	agent.add(new Suggestion('Other'));

  
    }
  
    function phonebothmobile(agent){
    

        const phone = agent.parameters['mobile-phone-number'];

    
    	agent.add('Please select your Business registration type?');
      	agent.add(new Suggestion('Corporation'));
      	agent.add(new Suggestion('Joint Venture'));
      	agent.add(new Suggestion('LLC'));
      	agent.add(new Suggestion('Not for Profit Org'));
      	agent.add(new Suggestion('Partnership'));
      	agent.add(new Suggestion('S corporation'));
      	agent.add(new Suggestion('Trust'));
      	agent.add(new Suggestion('Other'));
		agent.context.set({
              'name':'phoneno-office-followup'
              });
  
    }

  
    function bussregtype(agent){
  
        const reg_type = agent.parameters['business_reg_type'];
        
        if (reg_type.toString() == 'Other'){
        
            agent.add('Please describe the Business Registration Type.');
        }
        
        else{

            agent.add('Can you please share some details of ' + reg_type.toString());
        }
  
    }
  
    function coveragestart(agent){
    
        const cov_start = agent.parameters['coverage-start-date'];
        
        let cov_start_date = new Date(cov_start.toString());
        
        let date = new Date();
    
        if(cov_start_date < date){
        
        agent.add('Sorry, We can only get you a policy that starts from today or later !');
        agent.add('Please enter some future date');
        
        agent.context.set({
                'name':'bussregdetail-followup'
                });
        }
        
        else{
        
            agent.add('Did you have any claim in the past 5 years?');
            agent.add(new Suggestion('yes'));
            agent.add(new Suggestion('no'));
        
        }
  
    }
  
    function claimsno(agent){
  
        agent.add('Thanks. Below are the Employer Liability Limit options  available for you. Please choose one');
        agent.add(new Suggestion("$100/$100/$300"));
        agent.add(new Suggestion("$100/$100/$500"));
        agent.add(new Suggestion("$100/$200/$500"));
    
  	}
  
    function employliab(agent){
  
        agent.add('Great. You can select one or more deductible type. Here are your options:');
        agent.add(new Suggestion('Medical'));
        agent.add(new Suggestion('Indemnity'));
        agent.add(new Suggestion('Other'));
        agent.add(new Suggestion('None'));
    }
  
    function deduct(agent){
  
        const deductible = agent.parameters.deductible;
        
        if (deductible.toString() == 'None'){
            agent.add('Do you have multiple locations?');
            agent.add(new Suggestion('Yes'));
            agent.add(new Suggestion('No'));
        }
        
        else{
            agent.add('Please select '+ deductible + ' deductible');
            agent.add(new Suggestion('500'));
            agent.add(new Suggestion('1000'));
            agent.add(new Suggestion('2000'));
            agent.add(new Suggestion('2500'));
        
        }
    
    }
  
    function deductamt(agent){

  		agent.add('Do you have multiple locations?');
    	agent.add(new Suggestion('Yes'));
          agent.add(new Suggestion('No'));
          
    }
  
    function claimnum(agent){
    	
    	const claims_num = agent.parameters['claims_num'];
          
  		agent.add('OK. Please let me know the claim details :Carrier Name, Loss Date & Loss Amount of the filed claim# 1');
        agent.add('What was the carrier name?');  

    }

  
    function claimdetailloss(agent){
    
        const loss_amt = agent.parameters['loss_amt'];
        const parameters = agent.context.get('claimnum-followup');
        var claims_num = parameters.parameters['claims_num'];
        let i =2;
      
        if ((claims_num-1) != 0){
        
            claims_num = claims_num -1;
            parameters.parameters['claims_num'] = claims_num ;
            //agent.add(claims_num.toString());
            agent.context.set({'name': 'claimnum-followup',
                                'lifespan': 5});
            agent.add('OK.Please provide me the claim details of claim# '+ i.toString());
            agent.add('What was the carrier name?');
            i = i +1;
        
        }
              
        else{
            agent.add('Thanks. Below are the Employer Liability Limit options  available for you. Please choose one');
            agent.add(new Suggestion('$100/$100/$300'));
            agent.add(new Suggestion('$100/$100/$500'));
            agent.add(new Suggestion('$100/$200/$500'));
        }
    
    }
  
  
    function locationno(agent){
  
        agent.add('Please confirm location#1 address');
        
        agent.add('Address: 1900 Colonel Sanders Ln, Louisville, KY 40213 ');
        agent.add(new Suggestion('Confirm'));
        agent.add(new Suggestion('Edit'));
    }

  
    function numlocation(agent){

        agent.add('Please confirm location#1 address');
        agent.add('Address: 1900 Colonel Sanders Ln, Louisville, KY 40213 ');
        agent.add(new Suggestion('Confirm'));
        agent.add(new Suggestion('Edit'));
    
        agent.context.set({'name': 'location-no-followup'});
  	
    }
  
    function locsic(agent){
  	
        const sic = agent.parameters['sic-loc1'];
        
        if(sic.toString().length != 4){
        
            agent.add('Please enter valid 4 digit code');
            agent.context.set({'name':'locname-followup',
                                'lifespan': 5
                            });
        }
        
        else{
        
            agent.add('Thanks. What is the NAIC code for this location.');
        }
  
    }
  
    function locnaic(agent){
    
        const naic = agent.parameters['naic-loc1'];
        
        if(naic.toString().length != 6){
        
            agent.add('Please enter valid 6 digit code');
            agent.context.set({'name':'locsic-followup',
                                'lifespan': 2});
        }
        
        else{

            const parameters = agent.context.get('locname-followup');
            const loc_name = parameters.parameters['loc-name'];
        
            agent.add('How many different Business types do you have for '+ loc_name.toString());
        
        }
  
    }
  
    function locbusstype(agent){
    
        var buss_type = agent.parameters['buss-type-loc1'];
        
        buss_type = buss_type -1;
    
        agent.add('Please enter keyword or class code that best describe the business for e.g. Florist, Clerical');
        agent.context.set({
            'name':'locbusstype-followup',
            'lifespan': 10,
            'parameters':{
            'buss-type-loc1':buss_type
            }
        });
  
    }
 
  
    function locclassc(agent){
  
  		const classc = agent.parameters['class-code-loc1']; 
    	
    	if (classc.toString().toLowerCase() == 'restaurant'){
          	agent.add('Great! Here is what I found:');
        	agent.add('Restaurant - 9082');
          	agent.add('Select the right business type:');
          	agent.add(new Suggestion('Traditional Restaurant - 9082'));
          	agent.add(new Suggestion('Fast Food Restaurant - 9083'));
          	agent.add(new Suggestion('Alcohol Restaurant - 9084'));
          	
        }
    
    	else if (classc.toString().toLowerCase() == 'florist' ){
          	agent.add('Great! Here is what I found:');
        	agent.add('Florist - 8001');
          	agent.add('Select the right business type:');
          	agent.add(new Suggestion('Restaurant - 9082'));
          	agent.add(new Suggestion('Florist - 8001'));
          	
        }

    	else{
        	agent.add('Sorry, I cannot find a business type that matches your entry, please re-try with another keyword or class code ');
        	agent.context.set({
              'name':'locbusstype-followup'
              });
        }
  
    }

  
    function locpayroll(agent){
  
        const payroll = agent.parameters['payroll-loc1']["amount"];
        agent.add('Okay, you have entered '+ payroll.toString());
        
        const parameters = agent.context.get('locbusstype-followup');
        var buss_type = parameters.parameters['buss-type-loc1'];
        var dnum =0;
        
        try{
            const parameters1 = agent.context.get('numlocation-followup');
            
            dnum = parameters1.parameters['num-location'];  
            
            dnum = dnum -1;  
            
            agent.add(parameters1);
        
        }
        
        catch (e){
        //pass
        }
        
        agent.add('Num location ' + dnum.toString());
        agent.add(buss_type.toString());
        
        if ((buss_type) != 0){
        
            buss_type = buss_type -1;
            agent.add(buss_type.toString());
        
            agent.context.set({'name': 'locbusstype-followup',
                                'lifespan': 5,
                                'parameters':
                                    {'buss-type-loc1': buss_type}
                            });

            agent.add('Please enter keyword or class code that best describe the business for e.g. Florist, Clerical');
            agent.context.set({'name': 'locpayroll-followup',
                                'lifespan': 0});
            
        }
            
        else{
            
            if(dnum>0){
            
            dnum = dnum -1;   

            agent.add('Please share the 2nd Location details with us.');
            agent.add('Tell me the Location Name.');  
            
            agent.context.set({
                'name':'numlocation-followup',
                'lifespan': 40,
                'parameters':{
                'num-location': dnum
                }
            });  
        // parameters1.parameters['num-location'] = dnum_location -2;  
            
            }
            
            else{ 
                agent.add('Great. Select one or more optional coverages as per your need. Here are your options:');
                agent.add(new Suggestion('U.S.L. & H, MCO'));
                agent.add(new Suggestion('Voluntary Comp'));
                agent.add(new Suggestion('Foreign Coverage'));
                agent.add(new Suggestion('None'));
            }
        }

    }
  
  
    function opcoverages(agent){
  
        agent.add('Alright. Final annual premium for the selected coverage is $30,000.');
        agent.add('The corresponding quote letter has been emailed to the email registered with your user profile.');
        agent.add('Would you like to work on buying the policy quoted or would you want to change the quote details?');
        agent.add(new Suggestion('Buy Policy Quoted'));
        agent.add(new Suggestion('Change Quote'));
    }

  
    function secloczip(agent){
  	
        const zip = agent.parameters['secloc-zip']; 
    
        if(zip.toString().length != 5){
            agent.add('Please enter valid 5 digit zip code');
            agent.context.set({'name': 'seclocstate-followup',
                                'lifespan': 2});
        
        }
    
        else{
            agent.add('OK. Provide me the SIC code.');
        }
  
    }

  
    function seclocsic(agent){
  	
        const sic = agent.parameters['secloc-sic'];
        
        if(sic.toString().length != 4){
        
            agent.add('Please enter valid 4 digit code');
            agent.context.set({'name':'secloczip-followup',
                                'lifespan': 2
                            });
        }
        
        else{
        
            agent.add('Thanks. What is the NAIC code for this location.');
        
        }
  
    }

  
    function seclocnaic(agent){
    
        const naic = agent.parameters['secloc-naic'];
        
        if(naic.toString().length != 6){
        
            agent.add('Please enter valid 6 digit code');
            agent.context.set({'name':'seclocsic-followup',
                                'lifespan': 2});
        }
        
        else{

            const parameters = agent.context.get('seclocname-followup');
            const loc_name = parameters.parameters['secloc-name'];
        
            agent.add('How many different Business types do you have for '+ loc_name.toString());
        
        }
  
    }

  
    function seclocclassc(agent){
  
  	    const classc = agent.parameters['secloc-classcode']; 
    	
    	if (classc.toString().toLowerCase() == 'restaurant'){
          	agent.add('Great! Here is what I found:');
        	agent.add('Restaurant - 9082');
          	agent.add('Select the right business type:');
          	agent.add(new Suggestion('Traditional Restaurant - 9082'));
          	agent.add(new Suggestion('Fast Food Restaurant - 9083'));
          	agent.add(new Suggestion('Alcohol Restaurant - 9084'));
          	//agent.add(buss_type.toString());
          	
        }
    
    	else if (classc.toString().toLowerCase() == 'florist' ){
          	agent.add('Great! Here is what I found:');
        	agent.add('Florist - 8001');
          	agent.add('Select the right business type:');
          	agent.add(new Suggestion('Restaurant - 9082'));
          	agent.add(new Suggestion('Florist - 8001'));
          	
        
        }

    	else{
        	agent.add('Sorry, I cannot find a business type that matches your entry, please re-try with another keyword or class code ');
        	agent.context.set({
              'name':'seclocbusstype-followup'
              });
        }
  
  
    }
  
  
    function seclocbusstype(agent){
  
        var seclocbuss_type = agent.parameters['secloc-busstype'];
            
        seclocbuss_type = seclocbuss_type -1;  
            
        agent.add('Please enter keyword or class code that best describe your business for e.g. Florist, Clerical');
        
        agent.context.set({
        'name':'seclocbusstype-followup',
        'lifespan': 10,
        'parameters':{
            'secloc-busstype':seclocbuss_type
            }
        });  
  
    }
  
  
    function seclocpayroll(agent){
  
        const payroll = agent.parameters['secloc-payroll']["amount"];
        
        agent.add('Okay, you have entered '+ payroll.toString());
        
        const parameters = agent.context.get('seclocbusstype-followup');
        
        var seclocbusstype = parameters.parameters['secloc-busstype'] ;
        
        agent.add(seclocbusstype.toString());
        
        const parameters1 = agent.context.get('numlocation-followup');
        
        var dnum_location = parameters1.parameters['num-location'];
    
        agent.add('Num location'+ dnum_location.toString()); 
    
        if ((seclocbusstype) > 0){

            seclocbusstype = seclocbusstype -1;
            agent.add(seclocbusstype.toString());
            agent.context.set({'name': 'seclocbusstype-followup',
                                'lifespan': 10,
                            'parameters':
                            {'secloc-busstype': seclocbusstype}
                            });
            agent.context.set({'name': 'numlocation-followup',
                                'lifespan': 40}); 
            agent.add('Please enter keyword or class code that best describe the business for e.g. Florist, Clerical');
            
        }
     	
        else{
        
            if(dnum_location!=0){
            
                dnum_location = dnum_location -1;  
                agent.context.set({'name': 'locpayroll-followup',
                                    'lifespan': 5});   
                
                agent.context.set({'name': 'numlocation-followup',
                                    'lifespan': 40,
                                'parameters':{'num-location':dnum_location}
                                }); 
                agent.add('Please share the 3rd Location details with us.');
                agent.add('Tell me the Location Name.');  
                
                
                agent.add('Num location'+ dnum_location.toString());   
            
            }
        
            else{ 

                agent.add('Great. Select one or more optional coverages as per your need. Here are your options:');
                agent.add(new Suggestion('U.S.L. & H, MCO'));
                agent.add(new Suggestion('Voluntary Comp'));
                agent.add(new Suggestion('Foreign Coverage'));
                agent.add(new Suggestion('None'));
                agent.context.set({'name': 'locpayroll-followup',
                                    'lifespan': 5}); 

            }
        }
  
    }
  
  	function emaildefault(agent){

        agent.add('Sorry can you say email address again.');

    }
  
  
  // // Uncomment and edit to make your own intent handler
  // // uncomment `intentMap.set('your intent name here', yourFunctionHandler);`
  // // below to get this function to be run when a Dialogflow intent is matched
  // function yourFunctionHandler(agent) {
  //   agent.add(`This message is from Dialogflow's Cloud Functions for Firebase editor!`);
  //   agent.add(new Card({
  //       title: `Title: this is a card title`,
  //       imageUrl: 'https://developers.google.com/actions/images/badges/XPM_BADGING_GoogleAssistant_VER.png',
  //       text: `This is the body text of a card.  You can even use line\n  breaks and emoji! 💁`,
  //       buttonText: 'This is a button',
  //       buttonUrl: 'https://assistant.google.com/'
  //     })
  //   );
  //   agent.add(new Suggestion(`Quick Reply`));
  //   agent.add(new Suggestion(`Suggestion`));
  //   agent.setContext({ name: 'weather', lifespan: 2, parameters: { city: 'Rome' }});
  // }

  // // Uncomment and edit to make your own Google Assistant intent handler
  // // uncomment `intentMap.set('your intent name here', googleAssistantHandler);`
  // // below to get this function to be run when a Dialogflow intent is matched
  // function googleAssistantHandler(agent) {
  //   let conv = agent.conv(); // Get Actions on Google library conv instance
  //   conv.ask('Hello from the Actions on Google client library!') // Use Actions on Google library
  //   agent.add(conv); // Add Actions on Google library responses to your agent's response
  // }
  // // See https://github.com/dialogflow/dialogflow-fulfillment-nodejs/tree/master/samples/actions-on-google
  // // for a complete Dialogflow fulfillment library Actions on Google client library v2 integration sample

  // Run the proper function handler based on the matched Dialogflow intent name
  let intentMap = new Map();
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Default Fallback Intent', fallback);
  intentMap.set('FEIN', fein);
  intentMap.set('Insurance-Line',insurance_line);
  intentMap.set('NQ', nq);
  intentMap.set('NQ-no', nqno);
  intentMap.set('ClassC', classc);
  intentMap.set('numemp', numemp);
  intentMap.set('startdate',startdate);
  intentMap.set('payroll',payroll);
  intentMap.set('state-no',stateno);
  intentMap.set('activities-no1',activitiesno);
  intentMap.set('EditNa',editna);
  intentMap.set('EditAdd', editadd);
  intentMap.set('EditAdd-no', editaddno);
  intentMap.set('EditPhn-no', editphnno);
  intentMap.set('EditPh', editph);
  intentMap.set('EditWe-no', editweno);
  intentMap.set('EditWe', editwe);
  intentMap.set('EditBO-no', editbono);
  intentMap.set('EditBO', editbo);
  intentMap.set('quote-no', quoteno);
  intentMap.set('Zip', zip);
  intentMap.set('BusinessNa',businessna);
  intentMap.set('me-yes',meyes);
  intentMap.set('dba', dba);
  intentMap.set('bussedit',bussedit);
  intentMap.set('busseditna',busseditna);
  intentMap.set('busseditna-no',busseditnano);
  intentMap.set('busseditadd',busseditadd);
  intentMap.set('busseditadd-no',busseditaddno);
  intentMap.set('busseditfein',busseditfein);
  intentMap.set('busseditfein-no',busseditfeinno);
  intentMap.set('busseditncci',busseditncci);
  intentMap.set('busseditncci-no',busseditnccino);
  intentMap.set('busseditwebsite',busseditwebsite);
  intentMap.set('busseditwebsite-no',busseditwebsiteno);
  intentMap.set('email', email);
  intentMap.set('emaildefault', emaildefault);
  intentMap.set('phoneno-mobile', phonenomobile);
  intentMap.set('phoneno-office', phonenooffice);
  intentMap.set('phone-both-mobile', phonebothmobile);
  intentMap.set('bussregtype', bussregtype);
  intentMap.set('coveragestart', coveragestart);
  intentMap.set('claims-no', claimsno);
  intentMap.set('employliab', employliab);
  intentMap.set('deduct', deduct);
  intentMap.set('deductamt', deductamt);
  intentMap.set('claimnum', claimnum);
  intentMap.set('claimdetail-loss', claimdetailloss);
  intentMap.set('location-no', locationno);
  intentMap.set('numlocation', numlocation);
  intentMap.set('locsic', locsic);
  intentMap.set('locnaic', locnaic);
  intentMap.set('locclassc', locclassc);
  intentMap.set('locbusstype', locbusstype);
  intentMap.set('locpayroll', locpayroll);
  intentMap.set('opcoverages', opcoverages);
  intentMap.set('secloczip', secloczip);
  intentMap.set('seclocnaic', seclocnaic);
  intentMap.set('seclocsic', seclocsic);
  intentMap.set('seclocclassc', seclocclassc);
  intentMap.set('seclocbusstype', seclocbusstype);
  intentMap.set('seclocpayroll', seclocpayroll);
  agent.handleRequest(intentMap);
});
