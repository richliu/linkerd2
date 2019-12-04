package gateway

import (
	"fmt"
	"sort"
	"strings"

	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
)

const (
	// CustomRequestHeadersKey is the key used for the custom request headers
	// annotation.
	CustomRequestHeadersKey = "ingress.kubernetes.io/custom-request-headers"

	// L5DHeader represents the name of the custom header added to the request.
	L5DHeader = "l5d-dst-override"
)

// CustomRequestHeaders represents a collection of headers.
type CustomRequestHeaders map[string]string

// GetCustomRequestHeaders creates a new CustomRequestHeaders instance from an
// unstructured object, returning also if the operation succeeded or not.
func GetCustomRequestHeaders(obj *unstructured.Unstructured, separator string) (CustomRequestHeaders, bool) {
	headers := make(map[string]string)
	annotation, ok := obj.GetAnnotations()[CustomRequestHeadersKey]
	if !ok {
		return headers, false
	}
	for _, header := range strings.Split(annotation, separator) {
		sepIndex := strings.Index(header, ":")
		if sepIndex == -1 {
			continue
		}
		k := strings.TrimSpace(header[:sepIndex])
		v := strings.TrimSpace(header[sepIndex+1:])
		headers[k] = v
	}
	return headers, true
}

// ToString converts the headers collection to a string using the separator
// provided.
func (h CustomRequestHeaders) ToString(separator string) string {
	pairs := make([]string, 0, len(h))
	for k, v := range h {
		pairs = append(pairs, fmt.Sprintf("%s:%s", k, v))
	}
	sort.Slice(pairs, func(i, j int) bool { return pairs[i] < pairs[j] })
	return strings.Join(pairs, separator)
}

// ContainsL5DHeader checks if the collection of headers contains the L5D
// header.
func (h CustomRequestHeaders) ContainsL5DHeader() bool {
	_, ok := h[L5DHeader]
	return ok
}
