import React from 'react';
import { Text, View, TouchableOpacity, StyleSheet,Image } from 'react-native';
import * as Permissions from 'expo-permissions';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { TextInput } from 'react-native-gesture-handler';
import firebase from "firebase";
import db from "../config.js";

export default class TransactionScreen extends React.Component {
  constructor() {
    super();
    this.state = {
      hasCameraPermissions: null,
      scanned: false,
      scannedData: '',
      buttonState: 'normal',
      scannedBookID:"",
      scannedStudentID:""
    }
  }

  getCameraPermissions = async (ID) => {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);

    this.setState({
      /*status === "granted" is true when user has granted permission
        status === "granted" is false when user has not granted the permission
      */
      hasCameraPermissions: status === "granted",
      buttonState: ID,
      scanned: false
    });
  }

  handleBarCodeScanned = async ({ type, data }) => {
    const {buttonState}=this.state
    if(buttonState==="BookID"){

    
    this.setState({
      scanned: true,
      scannedBookID: data,
      buttonState: 'normal'

    });
  }
  else if(buttonState==="StudentID"){
      this.setState({
        scanned: true,
        scannedStudentID: data,
        buttonState: 'normal'

      });
  }
  }
  initiateBookIssue=async()=>{
    db.collection("transaction").add({
      "studentID":this.state.scannedStudentID,
      "bookID":this.state.scannedBookID,
      "data":firebase.fireStore.Timestamp.now().toDate(),
      "transactionType":"issue"
    })
    db.collection("books").doc(this.state.scannedBookID).update({
      "bookAvailability":false
    })
    db.collection("students").doc(this.state.scannedStudentID).update({
      "numberofBookIssued":firebase.firestore.FieldValue.increment(1)
    })
    this.setState({
      scannedStudentID:"",
      scannedBookID:""
    })
  }
  initiateBookReturn = async () => {
    db.collection("transaction").add({
      "studentID": this.state.scannedStudentID,
      "bookID": this.state.scannedBookID,
      "data": firebase.fireStore.Timestamp.now().toDate(),
      "transactionType": "issue"
    })
    db.collection("books").doc(this.state.scannedBookID).update({
      "bookAvailability": true
    })
    db.collection("students").doc(this.state.scannedStudentID).update({
      "numberofBookIssued": firebase.firestore.FieldValue.increment(-1)
    })
    this.setState({
      scannedStudentID: "",
      scannedBookID: ""
    })
  }
  handleTransaction=async()=>{
var transactionMessage=null
db.collection("books").doc(this.state.scannedBookID).get()
.then((doc)=>{
  var book=doc.data()
  if(book.bookAvailability){
    this.initiateBookIssue();
    transactionMessage="Book Issued"
  }
  else {
    this.initiateBookReturn()
    transactionMessage="Book Returned"
  }
})
this.setState({
  transactionMessage:transactionMessage
})
  }
  render() {
    const hasCameraPermissions = this.state.hasCameraPermissions;
    const scanned = this.state.scanned;
    const buttonState = this.state.buttonState;

    if (buttonState !== "normal" && hasCameraPermissions) {
      return (
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : this.handleBarCodeScanned}
          style={StyleSheet.absoluteFillObject}
        />
      );
    }

    else if (buttonState === "normal") {
      return (
        <View style={styles.container}>
        <View>
          <Image
            source={require("../assets/booklogo.jpg")}
            style={{height:200, width:200}}
          />
<Text style={{textAlign:"center", fontSize:20}}>Wily</Text>
        </View>
          <View style={styles.inputView}>
          <TextInput
          style={styles.inputBox}
          placeHolder="Book ID"
            value={this.state.scannedBookID}
          />
            <TouchableOpacity style={styles.scanButton}
             onPress={()=>{
               this.getCameraPermissions("BookID")
             }}>
          
          <Text style={styles.buttonText}>Scan</Text>
          </TouchableOpacity>
          </View>
          <View style={styles.inputView}>
            <TextInput
              style={styles.inputBox}
              placeHolder="Student ID"
              value={this.state.scannedStudentID}/>
            <TouchableOpacity style={styles.scanButton}
            onPress={()=>{
              this.getCameraPermissions("StudentID")
            }}>
              <Text style={styles.buttonText}>Scan</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
          style={styles.submitButton}
          onPress={async()=>{var transactionMessage=await this.handleTransaction()}}>
            <Text style={styles.submitButtonText}>Submit</Text>
          </TouchableOpacity>
        </View>
        
      );
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  displayText: {
    fontSize: 15,
    textDecorationLine: 'underline'
  },
  scanButton: {
    backgroundColor: '#66BB6A',
    padding: 10,
    margin: 10,
    width:50,
    borderWidth:1.5,
    borderLeftWidth:0
  },
  buttonText: {
    fontSize: 15,
    textAlign:"center",
    marginTop:10

  },
  inputView:{
flexDirection:"row",
margin:20
  },
  inputBox:{
    width:200,
    height:40,
    borderWidth:1.5,
    borderRightWidth:0,
    fontSize:20
  },
  submitButton:{
    backgroundColor:"#fBC02D",
    width:100,
    height:50
  },
  submitButtonText:{
padding:10,
textAlign:"center",
fontSize:20,
fontWeight:"bold",
color:"white"
  }
  
});