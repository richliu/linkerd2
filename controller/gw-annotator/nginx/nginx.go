package nginx

import (
	"regexp"
	"strings"

	"github.com/linkerd/linkerd2/controller/gw-annotator/gateway"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
)

const (
	// DefaultPrefix is the default annotations prefix used by the nginx
	// ingress controller.
	DefaultPrefix = "nginx"

	// ConfigSnippetKey is the annotations key used for the nginx configuration
	// snippet entry.
	ConfigSnippetKey = ".ingress.kubernetes.io/configuration-snippet"
)

var (
	l5dHeadersRE = regexp.MustCompile(`(proxy|grpc)_set_header l5d-dst-override .+`)
)

// Gateway represents a Gateway interface implementation for Nginx.
type Gateway struct {
	Object *unstructured.Unstructured
}

// IsAnnotated implements the Gateway interface.
func (g *Gateway) IsAnnotated() bool {
	_, configSnippet, found := g.getConfigSnippetAnnotation()
	if !found {
		return false
	}
	if l5dHeadersRE.MatchString(configSnippet) {
		return true
	}
	return false
}

// GenerateAnnotationPatch implements the Gateway interface.
func (g *Gateway) GenerateAnnotationPatch(clusterDomain string) (gateway.Patch, error) {
	annotationKey, configSnippet, found := g.getConfigSnippetAnnotation()
	op := "add"
	if found {
		op = "replace"
	}

	configSnippetEntries := append(getConfigSnippetEntries(configSnippet),
		"proxy_set_header l5d-dst-override $service_name.$namespace.svc."+clusterDomain+":$service_port;",
		"grpc_set_header l5d-dst-override $service_name.$namespace.svc."+clusterDomain+":$service_port;",
	)

	return []gateway.PatchOperation{{
		Op:    op,
		Path:  gateway.AnnotationsPath + strings.Replace(annotationKey, "/", "~1", -1),
		Value: strings.Join(configSnippetEntries, "\n"),
	}}, nil
}

func (g *Gateway) getConfigSnippetAnnotation() (string, string, bool) {
	for k, v := range g.Object.GetAnnotations() {
		if strings.Contains(k, ConfigSnippetKey) {
			return k, v, true
		}
	}
	// TODO (tegioz): potential issue, nginx annotation prefix is configurable
	// by user, so using the default one might not work. We will probably need
	// to provide it in the global config.
	return DefaultPrefix + ConfigSnippetKey, "", false
}

func getConfigSnippetEntries(configSnippet string) []string {
	allEntries := strings.Split(configSnippet, "\n")
	var filteredEntries []string
	for _, entry := range allEntries {
		if entry != "" {
			filteredEntries = append(filteredEntries, entry)
		}
	}
	return filteredEntries
}
