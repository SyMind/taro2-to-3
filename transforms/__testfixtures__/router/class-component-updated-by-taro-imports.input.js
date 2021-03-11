import React, { Component } from 'react';

class Foo extends Component {
  componentWillMount() {
    console.log(this.$router);
  }
}
