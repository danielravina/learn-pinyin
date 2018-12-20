import React from 'react';
import { Linking, FlatList, StatusBar } from 'react-native';
import axios from 'axios';
import firebase from 'firebase';
import styled from 'styled-components';
import Dialog from 'react-native-dialog';
import Swipeout from 'react-native-swipeout';

const Container = styled.View`
  flex: 1;
  backgroundColor: #10171e;
  paddingTop: 25px;
`;

const ListItem = styled.TouchableOpacity`
  justifyContent: center;
  backgroundColor: #101922;
  height: 80;
  paddingLeft: 20;
`;

const English = styled.Text`
  color: #ddd;
  fontSize: 20;
`;

const PinYin = styled.Text`
  color: white;
  fontSize: 30;
`;

const Button = styled.TouchableOpacity`
  borderWidth: 1;
  borderColor: rgba(0,0,0,0.2);
  alignItems: center;
  justifyContent: center;
  width: 60;
  height: 60;
  backgroundColor: rgb(29, 141, 238);
  borderRadius: 100;
  position: absolute;
  right: 20;
  bottom: 20;
`;

const ButtonText = styled.Text`
  fontSize: 28;
`;

export default class App extends React.Component {
  state = {
    textInput: '',
    loading: true,
    dialogVisible: false,
  }

  constructor() {
    super();
    this.listItem = this.listItem.bind(this);
    this.listRef = null;
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

  scrollToTop() {
    this.listRef.scrollToOffset({ x: 0, y: 0, animated: true });
  }

  fetchWords() {
    return firebase.database().ref('words').orderByKey().on('value', (snapshot) => {
      const words = [];
      snapshot.forEach((item) => {
        words.push(item.val());
      });

      this.setState({ words: words.reverse(), loading: false });
    });
  }

  onRemove({ created }) {
    firebase.database().ref(`words/${created}`).remove();
  }

  // onEdit(id) {

  // }

  itemRightButtons(item) {
    return [
      // { text: 'Edit', type: 'seconday', onPress: () => this.onEdit(item) },
      { text: 'Remove', type: 'delete', onPress: () => this.onRemove(item) },
    ];
  }

  itemLeftButtons(item) {
    return [
      {
        text: '🔉',
        type: 'primary',
        onPress() {
          Linking.openURL(encodeURI(`https://translate.google.ca/#view=home&op=translate&sl=en&tl=zh-CN&text=${item.en}`));
        },
      },
    ];
  }


  toPinyin(zh) {
    const id = Date.now();
    axios(`https://glosbe.com/transliteration/api?from=Han&dest=Latin&text=${zh}&format=json`).then(({ data }) => {
      firebase.database().ref(`words/${id}`).set({
        en: this.state.textInput,
        pinyin: data.text,
        created: id,
        zh,
      }).then(() => {
        this.setState({
          loading: false,
          dialogVisible: false,
          textInput: '',
        });
      });
    });
  }

  toZh() {
    this.setState({ loading: true });
    const bodyFormData = new FormData();
    bodyFormData.append('q', this.state.textInput.trim());
    bodyFormData.append('target', 'zh');
    bodyFormData.append('key', 'AIzaSyCH7-_TyanOH6G6UqiDHqHYT8g8mUMVr3s');
    axios({
      method: 'post',
      url: 'https://translation.googleapis.com/language/translate/v2',
      data: bodyFormData,
    }).then(({ data }) => {
      const zh = data.data.translations[0].translatedText;
      this.scrollToTop();
      this.toPinyin(zh);
    });
  }

  listItem({ item }) {
    return (
      <Swipeout
        style={{ marginBottom: 0, borderWidth: 1, borderColor: '#38444d' }}
        right={this.itemRightButtons(item)}
        left={this.itemLeftButtons(item)}
        autoClose
        sensitivity={10}
      >
        <ListItem activeOpacity={1}>
          <English>{item.en}</English>
          <PinYin>{item.pinyin}</PinYin>
        </ListItem>
      </Swipeout>
    );
  }

  render() {
    return (
      <Container>
        <StatusBar
          barStyle="light-content"
        />
        <FlatList
          ref={(l) => { this.listRef = l; }}
          renderItem={this.listItem}
          data={this.state.words}
          refreshing={this.state.loading}
          keyExtractor={item => item.created.toString()}
          onRefresh={() => {}}
        />
        <Button
          onPress={() => this.setState({ dialogVisible: true })}
        >
          <ButtonText>🙌</ButtonText>
        </Button>
        <Dialog.Container visible={this.state.dialogVisible} >
          <Dialog.Input
            autoFocus
            value={this.state.textInput}
            onChangeText={(value) => {
              this.setState({ textInput: value });
            }}
          />
          <Dialog.Button label="Cancel" onPress={() => this.setState({ dialogVisible: false })} />
          <Dialog.Button label="Add" onPress={() => this.toZh()} />
        </Dialog.Container>
      </Container>
    );
  }
}
