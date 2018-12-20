import React from 'react';
import { StyleSheet, Text, View, ScrollView, Button, TextInput } from 'react-native';
import axios from 'axios';
import firebase from 'firebase';

export default class App extends React.Component {
  state = {
    textInput: 'Test',
    pinyin: 'X',
  }

  constructor() {
    super();
    const config = {
      apiKey: 'AIzaSyCjLXoyWVxY8uX77NY-FK3_AyvvgjLKROw',
      authDomain: 'pinyin-f0eca.firebaseapp.com',
      databaseURL: 'https://pinyin-f0eca.firebaseio.com',
      projectId: 'pinyin-f0eca',
      storageBucket: 'pinyin-f0eca.appspot.com',
      messagingSenderId: '351863422992',
    };

    if (!firebase.apps.length) {
      firebase.initializeApp(config);
    }
  }

  componentDidMount() {
    this.fetchWords();
  }

  fetchWords() {
    firebase.database().ref('words').orderByKey.on('value', (snapshot) => {
      console.log(snapshot);
    });
  }

  toPinyin(zh) {
    axios(`https://glosbe.com/transliteration/api?from=Han&dest=Latin&text=${zh}&format=json`).then(({ data }) => {
      this.setState({ pinyin: data.text });
      firebase.database().ref(`words/${Date.now()}`).set({
        en: this.state.textInput,
        pinyin: data.text,
        created: Date(),
      }).then((data) => {
        // success callback
        console.log('data ', data);
      })
        .catch((error) => {
        // error callback
          console.log('error ', error);
        });
    });
  }

  toZh() {
    const bodyFormData = new FormData();
    bodyFormData.append('q', this.state.textInput);
    bodyFormData.append('target', 'zh');
    bodyFormData.append('key', 'AIzaSyCH7-_TyanOH6G6UqiDHqHYT8g8mUMVr3s');
    axios({
      method: 'post',
      url: 'https://translation.googleapis.com/language/translate/v2',
      data: bodyFormData,
    }).then(({ data }) => {
      const zh = data.data.translations[0].translatedText;

      this.toPinyin(zh);
    }).catch((err) => {
      console.log(err);
    });
  }

  render() {
    return (
      <View style={styles.container}>
        <TextInput
          value={this.state.textInput}
          onChangeText={v => this.setState({ textInput: v })}
        />
        <Button title="Translate" onPress={() => this.toZh()} />
        <Text>{this.state.pinyin}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
