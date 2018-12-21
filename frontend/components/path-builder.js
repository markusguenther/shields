import React from 'react'
import PropTypes from 'prop-types'
import styled, { css } from 'styled-components'
import pathToRegexp from 'path-to-regexp'
import humanizeString from 'humanize-string'
import { StyledInput, noAutocorrect } from './common'

const PathBuilderContainer = styled.div`
  display: inline-block;

  padding: 11px 14px 10px;

  border-radius: 4px;
  background: #eef;
`

const PathBuilderColumn = styled.span`
  height: 58px;

  float: left;
  display: flex;
  flex-direction: column;

  margin: 5px 0;

  ${({ horizPadding }) =>
    horizPadding &&
    css`
      padding-left: ${horizPadding};
      padding-right: ${horizPadding};
    `};
`

const PathLiteral = styled.div`
  margin-top: 20px;
  ${({ marginLeft }) =>
    marginLeft &&
    css`
      margin-left: ${marginLeft};
    `};
`

const NamedParamLabel = styled.label`
  height: 20px;
  width: 100%;

  text-align: center;

  font-family: system-ui;
  font-size: 11px;
  text-transform: lowercase;
`

const NamedParamInput = styled(StyledInput)`
  width: 100%;
  text-align: center;

  margin-bottom: 10px;
`

const NamedParamCaption = styled.span`
  width: 100%;
  text-align: center;

  color: #999;

  font-family: system-ui;
  font-size: 11px;
  text-transform: lowercase;
`

export default class PathBuilder extends React.Component {
  constructor(props) {
    super(props)

    const { pattern } = props
    const tokens = pathToRegexp.parse(pattern)

    const namedParams = {}
    tokens
      .filter(t => typeof t !== 'string')
      .map(t => t.name)
      .forEach(name => {
        namedParams[name] = ''
      })

    this.state = {
      tokens,
      namedParams,
    }
  }

  getPath(namedParams) {
    const { tokens } = this.state

    let isComplete = true
    const path = tokens
      .map(token => {
        if (typeof token === 'string') {
          return token
        } else {
          const { delimiter, name } = token
          let value = namedParams[name]
          if (!value) {
            isComplete = false
            value = `:${name}`
          }
          return `${delimiter}${value}`
        }
      })
      .join('')
    return { path, isComplete }
  }

  handleTokenChange = event => {
    const { name, value } = event.target
    const { namedParams: oldNamedParams } = this.state

    const namedParams = {
      ...oldNamedParams,
      [name]: value,
    }

    this.setState({ namedParams })

    const { onChange } = this.props
    if (onChange) {
      const path = this.getPath(namedParams)
      onChange(path)
    }
  }

  renderLiteral(literal, tokenIndex) {
    return (
      <PathBuilderColumn key={`${tokenIndex}-${literal}`}>
        <PathLiteral marginLeft={tokenIndex === 0 ? '3px' : undefined}>
          {literal}
        </PathLiteral>
      </PathBuilderColumn>
    )
  }

  renderNamedParam(token, tokenIndex, namedParamIndex) {
    const { delimiter, name } = token

    const { exampleParams } = this.props
    const exampleValue = exampleParams[name]

    const { namedParams } = this.state
    const value = namedParams[name]

    return (
      <React.Fragment key={token.name}>
        {this.renderLiteral(delimiter, tokenIndex)}
        <PathBuilderColumn horizPadding="8px">
          <NamedParamLabel htmlFor={name}>
            {humanizeString(name)}
          </NamedParamLabel>
          <NamedParamInput
            type="text"
            name={name}
            value={value}
            onChange={this.handleTokenChange}
            {...noAutocorrect}
          />
          <NamedParamCaption>
            {namedParamIndex === 0 ? `e.g. ${exampleValue}` : exampleValue}
          </NamedParamCaption>
        </PathBuilderColumn>
      </React.Fragment>
    )
  }

  render() {
    const { tokens } = this.state
    let namedParamIndex = 0
    return (
      <PathBuilderContainer>
        {tokens.map((token, tokenIndex) =>
          typeof token === 'string'
            ? this.renderLiteral(token, tokenIndex)
            : this.renderNamedParam(token, tokenIndex, namedParamIndex++)
        )}
      </PathBuilderContainer>
    )
  }
}
PathBuilder.propTypes = {
  pattern: PropTypes.string.isRequired,
  exampleParams: PropTypes.object.isRequired,
  onChange: PropTypes.func,
}
