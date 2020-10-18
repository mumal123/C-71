import React from 'react';
import { Text, View, TouchableOpacity, StyleSheet,Image,KeyboardAvoidingView, ToastAndroid, Alert } from 'react-native';
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
      scannedBookId:"",
      scannedStudentId:""
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
    if(buttonState==="BookId"){

    
    this.setState({
      scanned: true,
      scannedBookId: data,
      buttonState: 'normal'

    });
  }
  else if(buttonState==="StudentId"){
      this.setState({
        scanned: true,
        scannedStudentId: data,
        buttonState: 'normal'

      });
  }
  }
  initiateBookIssue=async()=>{
    db.collection("transaction").add({
      "studentId":this.state.scannedStudentId,
      "bookId":this.state.scannedBookID,
      "data":firebase.fireStore.Timestamp.now().toDate(),
      "transactionType":"issue"
    })
    db.collection("books").doc(this.state.scannedBookId).update({
      "bookAvailability":false
    })
    db.collection("students").doc(this.state.scannedStudentId).update({
      "numberOfBookIssued":firebase.fireStore.FieldValue.increment(1)
    })
    Alert.alert("Book Issued")
    this.setState({
      scannedStudentId:"",
      scannedBookId:""
    })
  }
  initiateBookReturn = async () => {
    db.collection("transaction").add({
      "studentId": this.state.scannedStudentId,
      "bookId": this.state.scannedBookId,
      "data": firebase.fireStore.Timestamp.now().toDate(),
      "transactionType": "issue"
    })
    db.collection("books").doc(this.state.scannedBookId).update({
      "bookAvailability": true
    })
    db.collection("students").doc(this.state.scannedStudentId).update({
      "numberOfBookIssued": firebase.fireStore.FieldValue.increment(-1)
    })
    Alert.alert("Book Returned")
    this.setState({
      scannedStudentId: "",
      scannedBookId: ""
    })
  }
  checkBookEligibility = async () => {
    const bookRef = await db.collection("books").where("bookId", "==", this.state.scannedBookId).get()
    var transactionType = ""
    if (bookRef.docs.length == 0) {
      transactionType = "false";
      console.log(bookRef.docs.length)
    }
    else {
      bookRef.docs.map((doc) => {
        var book = doc.data()
        if (book.bookAvailability)
          transactionType = "Issue"
        else
          transactionType = "Return"

      })
    }

    return transactionType

  }
  checkStudentEligibilityForBookIssue = async () => {
    const studentRef = await db.collection("students").where("studentId", "==", this.state.scannedStudentId).get()
    var isStudentEligible = ""
    if (studentRef.docs.length == 0) {
      this.setState({
        scannedStudentId: '',
        scannedBookId: ''
      })
      isStudentEligible = false
      Alert.alert("The student id doesn't exist in the database!")
    }
    else {
      studentRef.docs.map((doc) => {
        var student = doc.data();
        if (student.numberOfBooksIssued < 2) {
          isStudentEligible = true
        }
        else {
          isStudentEligible = false
          Alert.alert("The student has already issued 2 books!")
          this.setState({
            scannedStudentId: '',
            scannedBookId: ''
          })
        }

      })

    }

    return isStudentEligible

  }
  checkStudentEligibilityForReturn = async () => {
    const transactionRef = await db.collection("transactions").where("bookId", "==", this.state.scannedBookId).limit(1).get()
    var isStudentEligible = ""
    transactionRef.docs.map((doc) => {
      var lastBookTransaction = doc.data();
      if (lastBookTransaction.studentId === this.state.scannedStudentId)
        isStudentEligible = true
      else {
        isStudentEligible = false
        Alert.alert("The book wasn't issued by this student!")
        this.setState({
          scannedStudentId: '',
          scannedBookId: ''
        })
      }

    })
    return isStudentEligible
  }
  handleTransaction=async()=>{
    var transactionType = await this.checkBookEligibility();
    console.log("Transaction Type", transactionType)
    if (!transactionType) {
      Alert.alert("The book doesn't exist in the library database!")
      this.setState({
        scannedStudentId: '',
        scannedBookId: ''
      })
    }

    else if (transactionType === "Issue") {
      var isStudentEligible = await this.checkStudentEligibilityForBookIssue()
      if (isStudentEligible)
        this.initiateBookIssue()
      Alert.alert("Book issued to the student!")
    }

    else {
      var isStudentEligible = await this.checkStudentEligibilityForReturn()
      if (isStudentEligible)
        this.initiateBookReturn()
      Alert.alert("Book returned to the library!")
    }
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
        <KeyboardAvoidingView style={styles.container} behaviour="padding" enabled>
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
          onChangeText={text=>this.setState({scannedBookId:text})}
            value={this.state.scannedBookID}
          />
            <TouchableOpacity style={styles.scanButton}
             onPress={()=>{
               this.getCameraPermissions("BookId")
             }}>
          
          <Text style={styles.buttonText}>Scan</Text>
          </TouchableOpacity>
          </View>
          <View style={styles.inputView}>
            <TextInput
              style={styles.inputBox}
              placeHolder="Student ID"
                onChangeText={text => this.setState({ scannedStudentId: text })}
              value={this.state.scannedStudentId}/>
            <TouchableOpacity style={styles.scanButton}
            onPress={()=>{
              this.getCameraPermissions("StudentId")
            }}>
              <Text style={styles.buttonText}>Scan</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
          style={styles.submitButton}
          onPress={async()=>{var transactionMessage=await this.handleTransaction();
          this.setState(
            {scannedBookID:"",
            scannedStudentID:""}
          )}}>
            <Text style={styles.submitButtonText}>Submit</Text>
          </TouchableOpacity>
        </View>
        </KeyboardAvoidingView>
        
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
