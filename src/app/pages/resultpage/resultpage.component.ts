import { Component, OnInit } from "@angular/core";
import { Apollo } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';

import gql from 'graphql-tag';
import * as $ from "jquery";

import { AssetImportFacts, Query } from "../../types";

@Component({
  selector: "resultpage",
  templateUrl: "./resultpage.component.html",
  styleUrls: ["./resultpage.component.css"]
})
export class ResultPageComponent implements OnInit {
  years: String[]; //array to store all possible years of the search query selection
  data: AssetImportFacts; // variable to store the received data into a more organized way, to be used in the template
  importations: Observable<AssetImportFacts>; // variable to receive the query result returned by apollo
  byear;
  fyear;
  grouping;
  dataIsNotEmpty: boolean //Variable to control whether the table should be displayed or not, based on the presence of returned data
  groupingSelected: boolean //Variable to control which table will be displayed, based on the grouping option
  groupBy: Array<{ //Array to store objects of grouped data 
    name: String;
    totalValue: number;
  }> = [{ name: "default", totalValue: 0 }];

  constructor(private apollo: Apollo, private route: ActivatedRoute) {
    this.dataIsNotEmpty = false;
    this.years = ["2017"]; //initializing list so that the method "push" can be used
    for (var ano = 2016; ano >= 1998; ano--) {
      this.years.push(ano.toString()); //populating list "years" with the years between 1998 and 2016
    }

    //getting the initial and final years of the search date-range passed through the URL
    this.byear = this.route.snapshot.queryParamMap.get('byear');
    this.fyear = this.route.snapshot.queryParamMap.get('fyear');
    //getting the grouping option selected passe through the URL
    this.grouping = this.route.snapshot.queryParamMap.get('grouping');

    if (this.fyear < this.byear) {
      alert("The final year of the range can't be lower than the initial")
      return
    }

    this.queryData();
  }

  public queryData() {

    this.dataIsNotEmpty = false;

    this.data = {
      edges: [{
        node: {
          date: "", fobValue: "", ncm: { ncmNamePt: "" },
          originCountry: { countryNamePt: "", tradeBloc: { blocNamePt: "" } },
          urf: { urfName: "" },
          transportation: { transportationName: "" }
        }
      }] //code to empty data variable before receiving a new set of results
    };

    //Sending query to GraphQL end-point and receiving its result
    this.importations = this.apollo
      .watchQuery<Query>({
        query: gql`
        {
          allImport(commercializedBetween:"[\\"${
          this.byear
          }\\",\\"${this.fyear}\\"]"){
              edges{
                 node{
                  ncm{
                    ncmNamePt
                  }
                  date
                  fobValue
                  originCountry{
                    countryNamePt
                    tradeBloc{
                      blocNamePt
                    }
                  }
                  urf{
                    urfName
                  }
                  transportation{
                    transportationName
                  }
                 }

              }

          }

        }
        `
      })
      .valueChanges.pipe(
        //Maping result objects to importations variable
        map(result => result.data.allImport)
      );
    var gName
    var index = 0
    //Storing the results on data variable
    this.importations.forEach(element => {
      element.edges.forEach(edge => {
        this.dataIsNotEmpty = true; // if this piece of code is executed the result of the query was not empty

        //If there's a grouping type selected, the grouped data variable is filled
        if (this.grouping != "None") {

          this.groupingSelected = true;

          //Filling name temporary value based on which grouping was selected
          switch (this.grouping) {
            case "Economic Block":
              gName = edge.node.originCountry.tradeBloc.blocNamePt
              break;

            case "Country":
              gName = edge.node.originCountry.countryNamePt
              break;

            case "Urf":
              gName = edge.node.urf.urfName
              break;

            case "Transportation":
              gName = edge.node.transportation.transportationName
              break;

            default:
              break;
          }

          //Checking to see if the current group exists or not in the grouped data array
          index = this.groupBy.findIndex(e => e.name === gName);
          if (index > -1) {
            //if it does, the current value is just added
            this.groupBy[index].totalValue += parseFloat(edge.node.fobValue)
          }
          else {
            //if it does not, the current group is registered
            this.groupBy.push({ name: gName, totalValue: parseFloat(edge.node.fobValue) })
          }


        }

        this.data.edges.push({
          node: {
            date: edge.node.date,
            fobValue: edge.node.fobValue,
            ncm: { ncmNamePt: edge.node.ncm.ncmNamePt },
            originCountry: {
              tradeBloc: { blocNamePt: edge.node.originCountry.tradeBloc.blocNamePt },
              countryNamePt: edge.node.originCountry.countryNamePt
            },
            urf: { urfName: edge.node.urf.urfName },
            transportation: { transportationName: edge.node.transportation.transportationName }
          }
        });

      });
    });

    //Deleting the first element of the array, which is empty because of the initialization at the start of the function
    this.data.edges.shift();
    this.groupBy.shift();
  }

  //Function to export table as CSV
  public exportToCsv(element) {

    //Storing the table on a variable
    var table = element.nextElementSibling;
    var csvString = ""; //Creating a string to store generated csv

    //Generating CSV by going through the table rows and splitting cells values with ";" and lines with a line break
    for (var i = 0; i < table.rows.length; i++) {
      var rowData = table.rows[i].cells;
      for (var j = 0; j < rowData.length; j++) {
        csvString = csvString + rowData[j].innerHTML + ";";
      }
      csvString = csvString.substring(0, csvString.length - 1);
      csvString = csvString + "\n";
    }
    csvString = csvString.substring(0, csvString.length - 1);

    //Generating file with the csvString and simulating button click to start its download
    var a = $("<a/>", {
      style: "display:none",
      href: "data:application/octet-stream;base64," + btoa(csvString), //Generating the file
      download: "assetsData.csv"
    }).appendTo("body");
    a[0].click(); //Simulating click
    a.remove(); //Removing temporary button
  }

  ngOnInit() {

  }
}
