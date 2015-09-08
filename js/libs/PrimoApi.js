/**
Changes required:
Line 15: change to your Primo host.
Line 16: change to your Primo institution.
Line 53: change to your Primo subject limit (what you put in the MARC 692 $a field)
Line 100: change facet_local5 to your Primo facet.


*/


$(document).ready(function() {

 	searchRequest = {
		host : "primopmt-stage",
		institution: "myInstitution", 
		searchTerm:'',
		searchType:'',
		seachCode:'',		
		page:1,
		totalResults:0,
		sort:'stitle', 
		reset: function() {this.page = 1;this.totalResults=0}
	}

    searchRequest.reset();
	search('load');
	
	$("#letters a").click(function(event) {
		event.preventDefault();
        searchRequest.reset();
		search("letter", event.target.id);
	});

	$("#submit").click(function() {
		searchRequest.reset();
		search();
	});
	
	$('#facets').on('click', '.subjClick', function(event){
		event.preventDefault();
		var str = event.target.innerHTML;
		if(str !==null && str.length > 0)
		{
			searchRequest.reset();
			search("subject", str);	
		}
	});
});

function search(type, code) {
		
		var limit = "myLimit";
		
		searchRequest.term = $('#search').val();
		searchRequest.searchType = type;
		searchRequest.searchCode = code;
		
		var query;
		if(type == "load")
		{
			query = "query=sub,exact," + encodeURIComponent(limit);
		}
		else if(type == "letter")
		{
			if(code == "All")
			{
				"query=sub,exact," + encodeURIComponent(limit);
			}
			else
			{
				query = "query=sub,exact," + encodeURIComponent(limit) + "&query=facet_atoz,exact," + encodeURIComponent(code);
			}	
		}
		else if(type == "subject")
		{
			query = "query=sub,exact," + encodeURIComponent(code);
		}		
		else
		{
		    if (searchRequest.term == undefined || searchRequest.term == '') 
			{
			    $("#totalResults").empty();
				$("#results").empty();
				$("#totalResults").append("<span class='total'>Please enter a search term.</span>" );
				return;
			}
			query = "query=any,exact," + encodeURIComponent(searchRequest.term);
		}
	
		index = 1;
		
		/***************** CALCULATE PAGE NUMBER ****************/
		if (searchRequest.page != 1) {
			index = (searchRequest.page - 1) * 10;
			if (index == 0) index = 1;
		} 
		
	    query += "&query=facet_local5,exact," + encodeURIComponent(limit.replace(',', ' '));
 
    	/***************** PERFORM THE SEARCH REQUEST *****************/
		var myurl = 'http://' + searchRequest.host + '/PrimoWebServices/xservice/search/brief' +
        '?institution=' + searchRequest.institution + '&' + query + '&bulkSize=10&indx=' + index +  
     	'&sortField=' +  searchRequest.sort + 
        '&lang=eng&json=true&callback=parseResponse';
		
		$.ajax({ 
			url : myurl, 
			data : null, 
			timeout : 10000, 
			dataType : "jsonp"
		}); 
	}

	function parseResponse(data) {
	
			   searchRequest.totalResults = data["SEGMENTS"]["JAGROOT"]["RESULT"]["DOCSET"]["@TOTALHITS"];
			   
			   if(searchRequest.totalResults == "0")
			   {
			        $("#totalResults").empty();
					$("#results").empty();
					$("#totalResults").append("<span class='total'>No Results</span>" );
                    return;
			   }
			  
        	   /*********************************************** FACETS ******************************************************/
        	   if(searchRequest.searchType == "load")
			   {
					$("#facets").empty();
					if (data["SEGMENTS"]["JAGROOT"]["RESULT"]["FACETLIST"] != null) 
					{
						$.each(data["SEGMENTS"]["JAGROOT"]["RESULT"]["FACETLIST"]["FACET"],  function(key, record) 
						{

						var facetValues;	
						if(record['@NAME'] == "topic")
						{
							facetValues = getFacetValues(record['@NAME'], record["FACET_VALUES"]);
						}	
					  
						if (facetValues == "") return;
						
						    if(record['@NAME'] == "topic")
							{
								$("#facets").append(
									"<div>" +
									"<h4>Subject Areas</h4>" +
		 							"<ul>" +  facetValues + "</ul>" +  
		 							"</div>");
							}		
						});
					}
				}
        	   
        	   /*********************************************** RECORDS ******************************************************/
		        $("#results").empty();
        	   
        	   var records = data["SEGMENTS"]["JAGROOT"]["RESULT"]["DOCSET"]["DOC"];
        	   if (!(records instanceof Array)) {records = [records];} //only 1 record returned
        	   
			   if(searchRequest.searchType == "load")
			   {
					return;
			   }
			   
			    $.each(records,
		                function(index, record) {
		        				
					        	var pnx = record;
								
								if (record && record.PrimoNMBib) {
					        		pnx = record.PrimoNMBib.record;
					        	}
								
								var url = getUrl(pnx.links.linktorsrc);
								
								
								var regExp = /\$\$DFulltext/;
								var matches = regExp.exec(pnx.links.linktorsrc);
								if(matches != null)
								{
									var fullText = " <font color=\"red\">(FullText)</font>";
								}		
								
								
								var res = 
	        					"<table><tr><td style='vertical-align: top;width: 4.5em;'>" + ((+ index + +1) + (10 * (searchRequest.page-1))) + "</td>" +
								"<td><b><a href=\"" + url + "\" target=\"_blank\">" + pnx.display.title + "</a></b>";
								
								if (fullText)
								{
									res += fullText;
								}
								
								subject = pnx.display.subject;
						   		description = pnx.display.description;
								
								//add subject and description if such exist
		        				if (subject) 
								{
									res += "<div class='muted'>" +subject + "</div>";
								}
		                        
								if (description) res += "<div class='below-the-fold'>" + description + "</div>";  
		                        res += "</td></tr></table><hr>";
		                        
		                        $("#results").append(res);
		                }
		        );
		        
		        /******************************************* PAGINATION *************************************************/
		        //using the javascript library taken from: 
		        //http://flaviusmatis.github.io/simplePagination.js/
		        $(function() {					
		            $("#pagination").pagination({
					    items: searchRequest.totalResults,
		                itemsOnPage: 10,
		                onPageClick: function(pageNumber, event) {searchRequest.page = pageNumber;search(searchRequest.searchType, searchRequest.searchCode);},
		                currentPage: searchRequest.page,
		                cssStyle: 'compact-theme'
		            });
		        });
		        /*************************************************************************************************/	        
				
		        /*************************************************************************************************/
		        $("#totalResults").empty();
				
				if(searchRequest.totalResults > 10)
				{
					searchRequest.totalResults = parseInt(searchRequest.totalResults) + 1;
				}
				
		        if (index == 1) index = 0;
		        
	         if (searchRequest.totalResults < 10) {toNumber = searchRequest.totalResults} else {toNumber = (index + 10)}; 
		        
		        $("#totalResults").append("<span class='total'>Results " + (index + 1) + " - " + 
		        				toNumber + " of </span>" + searchRequest.totalResults );

		        
		        $("#details").empty();
   }
	//Support clicking Enter to search
	$(document).keypress(function(e) {
	    if(e.which == 13) {
	    	searchRequest.reset();
	    	search();
	    }
	});
	
	//Receive an array of facet values, return these as a <li> list
	function getFacetValues(facetType, facetValues) {
		var ret = "";
		
		//only 1 value in facet, we receive the element itself
		if (facetValues.length == undefined) {
			facetValues = [facetValues];
		}
		
		var Values = [];
		$.each(facetValues, function(i, record) 
		{
			var fv = record["@KEY"];
				Values.push(fv);
		});
		Values.sort();
		
		$.each(Values, function(index, value)
		{
			 ret += "<li><a title='" +  value + "' " + 
			 "href='#' class=\"subjClick\">" + 			        
			 value.substring(0,50) + "</a></li>";			
		});

		 return ret;
	}
	
	function getUrl(pnxLink)
	{
		var url = "#";
		var processUrl = pnxLink;
		if($.isArray(processUrl))
		{
			var urlString = processUrl[0];
			if(urlString !== null && urlString.length > 1)
			{
				var firstUrl = urlString.split("linktorsrc");
				processUrl = firstUrl[0];
			}
		}
								
		var regExp = /\$\$U(.*)\$\$/;
		var matches = regExp.exec(processUrl);
		if(matches != null)
		{
			url = matches[1];
		}
		return url;
	}
